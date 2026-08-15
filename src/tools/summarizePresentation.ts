import { SummarizePresentationArgsSchema, type SummarizePresentationArgs } from '../schemas.js';
import { handleGoogleApiError } from '../utils/errorHandler.js';
import type { ToolModule, ToolResult } from '../utils/toolExecutor.js';
import type { slides_v1 } from 'googleapis';

const JSON_INDENT = 2;
const SLIDE_FIELDS =
  'presentationId,title,revisionId,slides(objectId,pageElements(shape(text(textElements(textRun(content)))),table(tableRows(tableCells(text(textElements(textRun(content))))))),slideProperties(notesPage(pageElements(shape(text(textElements(textRun(content))))))))';

const textRuns = (elements: slides_v1.Schema$TextElement[] | undefined): string[] =>
  elements?.map((item) => item.textRun?.content?.trim() ?? '').filter(Boolean) ?? [];

const textFromShape = (element: slides_v1.Schema$PageElement): string[] => textRuns(element.shape?.text?.textElements);

const textFromTable = (element: slides_v1.Schema$PageElement): string[] =>
  element.table?.tableRows?.flatMap(
    (row) => row.tableCells?.flatMap((cell) => textRuns(cell.text?.textElements)) ?? []
  ) ?? [];

const extractText = (elements: slides_v1.Schema$PageElement[] | undefined): string[] => {
  if (!elements) {
    return [];
  }
  return elements.flatMap((element) => [...textFromShape(element), ...textFromTable(element)]);
};

const emptySummary = (title: string | null | undefined): ToolResult => ({
  content: [
    {
      type: 'text',
      text: JSON.stringify(
        {
          title: title ?? 'Untitled Presentation',
          slideCount: 0,
          summary: 'This presentation contains no slides.',
        },
        null,
        JSON_INDENT
      ),
    },
  ],
});

const slideContent = (slide: slides_v1.Schema$Page, index: number, includeNotes: boolean) => {
  const slideNumber = index + 1;
  const notes = includeNotes ? extractText(slide.slideProperties?.notesPage?.pageElements).join(' ').trim() : '';
  return {
    slideNumber,
    slideId: slide.objectId ?? `slide_${slideNumber}`,
    content: extractText(slide.pageElements).join(' '),
    ...(notes ? { notes } : {}),
  };
};

const buildSummary = (presentation: slides_v1.Schema$Presentation, includeNotes: boolean): ToolResult => {
  if (!presentation.slides?.length) {
    return emptySummary(presentation.title);
  }
  const slidesContent = presentation.slides.map((slide, index) => slideContent(slide, index, includeNotes));
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            title: presentation.title ?? 'Untitled Presentation',
            slideCount: slidesContent.length,
            lastModified: presentation.revisionId ? `Revision ${presentation.revisionId}` : 'Unknown',
            slides: slidesContent,
          },
          null,
          JSON_INDENT
        ),
      },
    ],
  };
};

const handler = async (slides: slides_v1.Slides, args: SummarizePresentationArgs): Promise<ToolResult> => {
  try {
    const presentation = (
      await slides.presentations.get({
        presentationId: args.presentationId,
        fields: SLIDE_FIELDS,
      })
    ).data;
    return buildSummary(presentation, args.include_notes === true);
  } catch (error: unknown) {
    throw handleGoogleApiError(error, 'summarize_presentation');
  }
};

export const summarizePresentation: ToolModule<SummarizePresentationArgs> = {
  name: 'summarize_presentation',
  schema: SummarizePresentationArgsSchema,
  handler,
  descriptor: {
    description: 'Extract text content from all slides in a presentation for summarization purposes',
  },
};

import { Configuration, PlaywrightCrawler } from 'crawlee';
import { Document } from 'langchain/document';
import { convert } from 'html-to-text';
import { addToPinecondeIndex, clearPineconeIndex } from './pinecone';

const MAX_PARSING_PAGES_COUNT = 500;

async function parse(url: string, onNewPage: (doc: Document) => void) {
  console.log('Start parsing');

  const config = new Configuration({
    purgeOnStart: true,
    persistStorage: false,
  });

  const crawler = new PlaywrightCrawler(
    {
      maxRequestsPerCrawl: MAX_PARSING_PAGES_COUNT,
      maxConcurrency: 10,

      async requestHandler({ request, page, enqueueLinks, crawler }) {
        try {
          if (
            crawler.stats.state.requestsFinished &&
            crawler.stats.state.requestsFinished % 10 === 0
          ) {
            console.log(`Processed ${crawler.stats.state.requestsFinished}`);
          }

          await page.waitForLoadState('domcontentloaded');

          const content = await page.content();

          await enqueueLinks({
            strategy: 'same-hostname',
          });

          const data = convert(content, {
            selectors: [
              {
                selector: 'a',
                format: 'skip',
              },
              {
                selector: 'img',
                format: 'skip',
              },
            ],
          });

          onNewPage({
            pageContent: data,
            metadata: {
              link: request.url,
              title: await page.title(),
            },
          });
        } catch (e) {
          console.error(e);
        }
      },
    },
    config
  );

  await crawler.run([url]);

  await crawler.requestQueue.drop();

  console.log('Finish parsing');
}

export async function parseAndStore(url: string, onDone: () => Promise<void>) {
  const docs: Document[] = [];

  await parse(url, (doc) => docs.push(doc));

  await clearPineconeIndex(process.env.PINECONE_NAMESPACE);

  await addToPinecondeIndex(process.env.PINECONE_NAMESPACE, docs);

  await onDone();
}

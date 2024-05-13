import crawl from "./crawl.js";
import notionJob from "./notion.js";

const main = async () => {
    await crawl();
    await notionJob();
};

main();

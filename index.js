import crawl from "./crawl.js";
import notionJob from "./notion.js";

/*
 * 크롤링 작업 후 노션 작업 실행
 */
const main = async () => {
    await crawl();
    await notionJob();
};

main();

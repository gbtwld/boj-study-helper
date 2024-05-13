import puppeteer from "puppeteer";
import cheerio from "cheerio";
import path from "path";
import fs from "fs";
import { configDotenv } from "dotenv";
import axios from "axios";

const ID = configDotenv().parsed.BOJ_ID;
const PW = configDotenv().parsed.BOJ_PW;
const __dirname = path.resolve();

let workbookData = [];

export default async function crawl() {
    /*
     * 크롬 확장 프로그램 사용을 위해 확장 프로그램의 경로 저장
     */
    const pathToExtension = path.join(process.cwd(), "captcha_extension");
    /*
     * puppeteer를 사용하여 크롬을 실행
     * headless: false로 설정하여 크롬 창을 보이게 함
     * args: 크롬 확장 프로그램을 사용하기 위한 설정
     */
    const browser = await puppeteer.launch({
        headless: false,
        args: [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`],
    });
    /*
     * 새로운 페이지 생성
     */
    const page = await browser.newPage();

    /*
     * 에러 디버깅을 위한 이벤트 핸들러 등록
     */
    // page.on("requestfailed", (request) => {
    //     console.log(`url: ${request.url()}, errText: ${request.failure().errorText}, method: ${request.method()}`);
    // });
    // page.on("pageerror", (err) => {
    //     console.log(`Page error: ${err.toString()}`);
    // });

    /*
     * 그룹 문제집 페이지로 리다이렉트 되는 로그인 페이지로 이동
     * 로그인 정보 입력 후 로그인
     */
    await page.goto("https://www.acmicpc.net/login?next=%2Fgroup%2Fworkbook%2F20856");
    await page.evaluate(
        (id, pw) => {
            document.querySelector('input[name="login_user_id"]').value = id;
            document.querySelector('input[name="login_password"]').value = pw;
        },
        ID,
        PW
    );
    await page.click("#submit_button");
    /*
     * 페이지 로딩이 완료될 때까지 대기
     */
    await page.waitForNavigation({ timeout: 0 });

    /*
     * 현재 페이지의 url이 그룹 문제집 페이지인지 확인
     */
    if (page.url() === "https://www.acmicpc.net/group/workbook/20856") {
        /*
         * 현재 페이지의 html을 가져와서 cheerio로 파싱 후 문제집 링크 추출
         */
        const groupContent = await page.content();
        const $ = cheerio.load(groupContent);
        const workbookList = $("tr > td:nth-child(3) > a");

        let index = 0;
        for (const workbook of workbookList) {
            /*
             * 문제집 페이지로 이동
             */
            await page.goto(`https://www.acmicpc.net${workbook?.attribs?.href}`);
            const workbookContent = await page.content();
            const $ = cheerio.load(workbookContent);
            const workbookName = $(
                "body > div.wrapper > div.container.content > div > div:nth-child(4) > h1 > span"
            ).text();
            const problemListNode = $("tr > td:nth-child(1)");
            let problemArr = [];
            for (const problem of problemListNode) {
                problemArr.push(problem.children[0].data);
            }
            workbookData.push({
                id: index,
                workbookName,
                workbookURL: `https://www.acmicpc.net${workbook?.attribs?.href}`,
                problems: problemArr,
            });
            await page.goBack();
            index++;
        }
    } else {
        console.log("로그인 실패");
    }

    /*
     * 문제집 데이터를 역순으로 저장
     */
    workbookData.reverse();

    for (const workbook of workbookData) {
        const res = await axios.get("https://solved.ac/api/v3/problem/lookup", {
            params: {
                problemIds: workbook.problems.join(`,`),
            },
            headers: { "x-solvedac-language": "ko", Accept: "application/json" },
            timeout: 2000,
        });

        /*
         * solved.ac api는 문제 id를 기준으로 정렬되어 있으므로
         * 문제집의 문제 순서대로 정렬
         */
        res.data.sort(
            (a, b) => workbook.problems.indexOf(`${a.problemId}`) - workbook.problems.indexOf(`${b.problemId}`)
        );

        workbookData[workbookData.indexOf(workbook)].problems = res.data;
        workbookData[workbookData.indexOf(workbook)].id = workbookData.indexOf(workbook);
    }

    /*
     * 크롤링한 데이터를 json 파일로 저장
     */
    const writeJsonFilePath = path.join(__dirname, "workbookData.json");
    fs.writeFileSync(writeJsonFilePath, JSON.stringify(workbookData, null, 2));

    /*
     * 크롬 브라우저 종료
     */
    await browser.close();
}

import { Client } from "@notionhq/client";
import { configDotenv } from "dotenv";
import fs from "fs";

const level = {
    0: "Unrated / Not Ratable",
    1: "Bronze V",
    2: "Bronze IV",
    3: "Bronze III",
    4: "Bronze II",
    5: "Bronze I",
    6: "Silver V",
    7: "Silver IV",
    8: "Silver III",
    9: "Silver II",
    10: "Silver I",
    11: "Gold V",
    12: "Gold IV",
    13: "Gold III",
    14: "Gold II",
    15: "Gold I",
    16: "Platinum V",
    17: "Platinum IV",
    18: "Platinum III",
    19: "Platinum II",
    20: "Platinum I",
    21: "Diamond V",
    22: "Diamond IV",
    23: "Diamond III",
    24: "Diamond II",
    25: "Diamond I",
    26: "Ruby V",
    27: "Ruby IV",
    28: "Ruby III",
    29: "Ruby II",
    30: "Ruby I",
};

const notion = new Client({
    auth: configDotenv().parsed.NOTION_SECRET,
});
const week_database_id = configDotenv().parsed.NOTION_DATABASE_ID;
const problem_database_id = configDotenv().parsed.NOTION_PROBLEM_DATABASE_ID;

async function pushProblemData(workbook) {
    // const { results } = await notion.databases.query({
    //     database_id: problem_database_id,
    // });

    /*
     * 역순으로 돌려야 노션에 추가할 때 순서대로 추가됨
     */
    for (const problem of workbook.problems.reverse()) {
        console.log(problem.problemId + "번 문제 추가중...");
        const tags = problem.tags.map((tag) => {
            return { name: tag.displayNames[0].name };
        });
        const res = await notion.pages.create({
            parent: { database_id: problem_database_id },
            properties: {
                Problem: {
                    type: "title",
                    title: [
                        {
                            type: "text",
                            text: {
                                content: `${problem.problemId}. ${problem.titleKo}`,
                            },
                        },
                    ],
                },
                Week: {
                    type: "select",
                    select: {
                        name: `${workbook.id + 1}주차`,
                    },
                },
                Difficulty: {
                    type: "select",
                    select: {
                        name: level[problem.level],
                    },
                },
                Tags: {
                    type: "multi_select",
                    multi_select: tags,
                },
                URL: {
                    type: "url",
                    url: `https://www.acmicpc.net/problem/${problem.problemId}`,
                },
            },
            children: [
                {
                    object: "block",
                    type: "heading_2",
                    heading_2: {
                        rich_text: [
                            {
                                type: "text",
                                text: {
                                    content: problem.titleKo,
                                },
                            },
                        ],
                    },
                },
                { object: "block", type: "divider", divider: {} },
                {
                    table: {
                        table_width: 3,
                        has_column_header: true,
                        children: [
                            {
                                type: "table_row",
                                table_row: {
                                    cells: [
                                        [
                                            {
                                                type: "text",
                                                text: {
                                                    content: "맞힌 사람",
                                                },
                                                annotations: {
                                                    bold: true,
                                                },
                                            },
                                        ],
                                        [
                                            {
                                                type: "text",
                                                text: {
                                                    content: "레벨",
                                                },
                                                annotations: {
                                                    bold: true,
                                                },
                                            },
                                        ],
                                        [
                                            {
                                                type: "text",
                                                text: {
                                                    content: "평균 시도 횟수",
                                                },
                                                annotations: {
                                                    bold: true,
                                                },
                                            },
                                        ],
                                    ],
                                },
                            },
                            {
                                type: "table_row",
                                table_row: {
                                    cells: [
                                        [
                                            {
                                                type: "text",
                                                text: {
                                                    content: `${problem.acceptedUserCount}`,
                                                },
                                            },
                                        ],
                                        [
                                            {
                                                type: "text",
                                                text: {
                                                    content: level[problem.level],
                                                },
                                            },
                                        ],
                                        [
                                            {
                                                type: "text",
                                                text: {
                                                    content: `${problem.averageTries}`,
                                                },
                                            },
                                        ],
                                    ],
                                },
                            },
                        ],
                    },
                },
                {
                    object: "block",
                    type: "heading_2",
                    heading_2: {
                        rich_text: [
                            {
                                type: "text",
                                text: {
                                    content: "문제 풀이",
                                },
                            },
                        ],
                    },
                },
                { object: "block", type: "divider", divider: {} },
                {
                    object: "block",
                    type: "column_list",
                    column_list: {
                        children: [
                            {
                                type: "column",
                                column: {
                                    children: [
                                        {
                                            type: "paragraph",
                                            paragraph: {
                                                rich_text: [{ type: "text", text: { content: "두재정" } }],
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                type: "column",
                                column: {
                                    children: [
                                        {
                                            type: "paragraph",
                                            paragraph: {
                                                rich_text: [{ type: "text", text: { content: "유훈" } }],
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                type: "column",
                                column: {
                                    children: [
                                        {
                                            type: "paragraph",
                                            paragraph: {
                                                rich_text: [{ type: "text", text: { content: "이승섭" } }],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
            ],
        });
    }
}

async function createWorkbookPageBlock(pageID, workbook) {
    await notion.blocks.children.append({
        block_id: pageID,
        children: [
            {
                bookmark: { url: workbook.workbookURL },
            },
        ],
    });
}

async function createWorkbookPage(workbook) {
    const createdPage = await notion.pages.create({
        parent: { database_id: week_database_id },
        properties: {
            Week: {
                type: "title",
                title: [
                    {
                        type: "text",
                        text: {
                            content: `${workbook.id + 1}주차`,
                        },
                    },
                ],
            },
            Workbook: {
                type: "rich_text",
                rich_text: [
                    {
                        type: "text",
                        text: {
                            content: workbook.workbookName,
                        },
                    },
                ],
            },
            URL: {
                url: workbook.workbookURL,
            },
        },
    });

    createWorkbookPageBlock(createdPage.id, workbook);
}

export default async function notionJob() {
    const data = JSON.parse(fs.readFileSync("./workbookData.json", "utf8"));
    const { results } = await notion.databases.query({
        database_id: week_database_id,
    });

    let existWorkbookList = [];

    for (const result of results) {
        existWorkbookList.push(result.properties.Workbook.rich_text[0].plain_text);
    }
    const filteredData = data.filter((workbook) => !existWorkbookList.includes(workbook.workbookName));

    /*
     * 역순으로 돌려야 노션에 추가할 때 순서대로 추가됨
     */
    for (const workbook of filteredData.reverse()) {
        await createWorkbookPage(workbook);
        await pushProblemData(workbook);
    }
}

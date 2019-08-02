import arg from "arg";
import { launch } from "puppeteer";
import { promises as fs } from "fs";

const args = arg({
    "--file": String,
    "-f": "--file"
});
const file = args["--file"];

const queries: RegExSearch[] = [
    {
        search: / rel="[^"]*"/g,
        replace: ""
    }
];

(async () => {
    const browser = await launch();
    const page = await browser.newPage();
    await page.goto(`https://github.com/microsoft-d365-ce-pfe-devops/d365-ce-devops-blogs/blob/master/blogs/devops/${file}.md`);
    await page.waitForSelector(".markdown-body");
    const containerHandle = await page.$(".markdown-body");
    let contents = await page.evaluate(container => container.innerHTML, containerHandle) as string;
    queries.forEach(query => {
        contents = contents.replace(query.search, query.replace);
    });
    await fs.writeFile("output.html", contents);
    await browser.close();
})();

interface RegExSearch {
    search: RegExp,
    replace: string
}
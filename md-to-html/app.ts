import arg from "arg";
import { promises as fs } from "fs";
import fetch from "node-fetch";
import pretty from "pretty";

const args = arg({
    "--file": String,
    "-f": "--file"
});
const file = args["--file"];

const queries: RegExSearch[] = [
    {
        search: /[\s\S]*<article class="markdown-body[^>]*>([\s\S]*)<\/article>[\s\S]*/,
        replace: "$1"
    },
    {
        search: / rel="[^"]*"/g,
        replace: ""
    },
    {
        search: /<h([0-9])><a id="user-content-([^"]*).*<svg.*\/svg><\/a>/g,
        replace: "<h$1 id=\"$2\">"
    },
    {
        search: /<div><a[^>]*>(<img[^>]*>)<\/a><\/div>/g,
        replace: "<div style=\"display: none;\">$1</div>"
    },
    {
        search: /<h1 .*/g,
        replace: ""
    },
    {
        search: /<a href="https:\/\/community.dynamics.com/g,
        replace: "<a href=\""
    },
    {
        search: /<a href="([^#][^"]*)">/g,
        replace: "<a target=\"_blank\" href=\"$1\">"
    },
    {
        search: /<\/pre><\/div>\n<p>/g,
        replace: "</pre></div>\n<p style=\"font-size: 85%; text-align: right;\">"
    },
    {
        search: /<div [^>]*><pre>/g,
        replace: "<div><pre style=\"background-color: #f6f8fa; border-radius: 3px; font-size: 85%; line-height: 1.45; margin-bottom: 0px; padding: 16px;\">"
    },
    {
        search: /<span class="pl-ent">/g,
        replace: "<span style=\"color: #22863a;\">"
    },
    {
        search: /<span class="pl-s">/g,
        replace: "<span style=\"color: #032f62;\">"
    },
    {
        search: /<span class="pl-pds">/g,
        replace: "<span style=\"color: #032f62;\">"
    }
];

(async () => {
    const response = await fetch(`https://github.com/microsoft-d365-ce-pfe-devops/d365-ce-devops-blogs/blob/master/blogs/devops/${file}.md`);
    let contents = await response.text();
    queries.forEach(query => {
        contents = contents.replace(query.search, query.replace);
    });
    contents = pretty(contents);
    await fs.writeFile("output.html", contents);
    console.log("output created.");
})();

interface RegExSearch {
    search: RegExp,
    replace: string
}
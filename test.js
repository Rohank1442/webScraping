const cheerio = require('cheerio');
const request = require('request-promise')
const fs = require('fs')
const json2csv = require('json2csv').Parser;
const puppeteer = require('puppeteer');

async function processEvent(event, page) {
    try {
        const query = "colleen cole";
        console.log("query: " + query);
        const finalQuery = `https://www.google.com/search?q=${encodeURIComponent(query)}&sourceid=chrome&ie=UTF-8`;
        await page.goto(finalQuery, { waitUntil: 'load', timeout: 30000 });

        const numResult = await page.evaluate(() => {
            let i = 0;
            document.getElementById('rso').childNodes.forEach(element => {
                if (element.tagName === "DIV") {
                    i++;
                }
            });
            return i;
        });

        console.log("Results for event:", numResult);
        // Add your logic to extract information and handle the results

        var results = [];
        for (let index = 1; index <= numResult; index++) {
            await page.waitForSelector('//*[@id="rso"]/div[' + index + ']');
            var [xpath] = await page.$x('//*[@id="rso"]/div[' + index + ']');
            var check = await page.evaluate(el => el.getElementByTagName('H3').length, xpath);
            if (check == 1) {
                var data = await page.evaluate(el => el.getElementByTagName('H3')[0].innerText, xpath);
                results.push(data);
            }
        }
        console.log(results)

    } catch (error) {
        console.error(error);
    }
}
// 22.1.0
async function run() {
    const eventData = ['test1', 'test2']
    try {
        let browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        for (const event of eventData) {
            await processEvent(event, page);
        }
    } catch (error) {
        console.error(error);
    }
}


// Run the script
run();

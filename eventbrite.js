const cheerio = require('cheerio');
const request = require('request-promise')
const fs = require('fs')
const json2csv = require('json2csv').Parser;
const puppeteer = require('puppeteer');

const htmlContent = `
<div class="feed-events-bucket__content__cards-container">
    <div class="eds-g-cell eds-g-cell--has-overflow eds-g-cell-1-1 feed__card-cell">
        <section class="discover-vertical-event-card" data-testid="home-event-card-828300508117">
            <div class="Container_root__4i85v NestedActionContainer_root__1jtfr event-card event-card__vertical vertical-event-card__action-visibility">
                <a href="https://www.eventbrite.com/e/women-entrepreneurs-professionals-meetup-tickets-828300508117?aff=ehometext" rel="noopener" target="_blank" class="event-card-link " aria-label="View WOMEN ENTREPRENEURS &amp; PROFESSIONALS MEETUP" data-event-id="828300508117" data-event-location="Hyderabad, TS" data-event-paid-status="paid" data-event-category="business">
                </a>
            </div>
        </section>
    </div>
    <div class="eds-g-cell eds-g-cell--has-overflow eds-g-cell-1-1 feed__card-cell">
        <section class="discover-vertical-event-card" data-testid="home-event-card-815647422397">
            <div class="Container_root__4i85v NestedActionContainer_root__1jtfr event-card event-card__vertical vertical-event-card__action-visibility">
                <a href="https://www.eventbrite.com/e/women-of-impact-awards-2024-tickets-815647422397?aff=ehometext" rel="noopener" target="_blank" class="event-card-link " aria-label="View Women of Impact Awards 2024" data-event-id="815647422397" data-event-location="Hyderabad, TS" data-event-paid-status="paid" data-event-category="business">
                </a>
            </div>
        </section>
    </div>
</div>
`;

const $ = cheerio.load(htmlContent);

const hrefList = [];
$('a').each((index, element) => {
    hrefList.push($(element).attr('href'));
});

// console.log(hrefList);

let eventData = []

async function processEvent(event, page) {
    try {
        const query = event;
        console.log("query: " + query);
        const finalQuery = `https://www.google.com/search?q=${encodeURIComponent(query)}&sourceid=chrome&ie=UTF-8`;
        await page.goto(finalQuery, { waitUntil: 'load', timeout: 0 });

        const numResult = await page.evaluate(() => {
            let i = 0;
            document.getElementById('rso').childNodes.forEach(element => {
                if (element.tagName === "DIV") {
                    i++;
                }
            });
            return i;
        });
        console.log("Results for " + event + ": ", numResult);

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

async function run() {
    try {
        eventData.forEach(async (event) => {
            let browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            let query = event.Title
            processEvent(query, page)
            // console.log("query: " + query);
            // const finalQuery = `https://www.google.com/search?q=${encodeURIComponent(query)}&sourceid=chrome&ie=UTF-8`
            // await page.goto(finalQuery, { waitUntill: 'load', timeout: 30000 });
            // var numResult = await page.evaluate(() => {
            //     var i = 0;
            //     document.getElementById('rso').childNodes.forEach(element => {
            //         if (element.tagName == "DIV") {
            //             i++;
            //         }
            //     });
            //     return i;
            // });
        });
    }
    catch (error) {
        console.log(error)
    }
}

const getLinks = async () => {
    for (let event of hrefList) {
        const response = await request({
            uri: event,
            headers: {
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate, br, zstd",
                "Accept-Language": "en-US,en;q=0.9,hi;q=0.8"
            },
        });
        let $ = cheerio.load(response)
        let Title = $('div.event-details__main-inner > h1').text();
        let Date = $('span.date-info__full-datetime').text();
        let Location = $('p.location-info__address-text').text();
        let Desc = $('div.eds-text--left > p').text();
        let OrgInfo = $('div[data-testid="read-more-contentx"] p').text();

        eventData.push({
            Title,
            Date,
            Location,
            Desc,
            OrgInfo
        });
    }

    const j2cp = new json2csv();
    const csv = j2cp.parse(eventData)

    fs.writeFileSync("./event.csv", csv, "utf-8");

    run();
}

getLinks();
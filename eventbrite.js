const cheerio = require('cheerio');
const request = require('request-promise');
const fs = require('fs');
const { Parser } = require('json2csv');
const puppeteer = require('puppeteer');

const htmlContent = `
<div class="feed-events-bucket__content__cards-container">
    <div class="eds-g-cell eds-g-cell--has-overflow eds-g-cell-1-1 feed__card-cell">
        <section class="discover-vertical-event-card" data-testid="home-event-card-828300508117">
            <div class="Container_root__4i85v NestedActionContainer_root__1jtfr event-card event-card__vertical vertical-event-card__action-visibility">
                <a href="https://www.eventbrite.com/e/meet-isb-pgp-admissions-team-in-lucknow-all-you-need-to-know-about-pgp-tickets-914469953247?aff=ebdssbcitybrowse" rel="noopener" target="_blank" class="event-card-link " aria-label="View Meet ISB PGP Admissions Team in Lucknow | All You Need To Know about PGP" data-event-id="914469953247" data-event-location="Lucknow, UP" data-event-paid-status="free" data-event-category="business">
                </a>
            </div>
        </section>
    </div>
    <div class="eds-g-cell eds-g-cell--has-overflow eds-g-cell-1-1 feed__card-cell">
        <section class="discover-vertical-event-card" data-testid="home-event-card-815647422397">
            <div class="Container_root__4i85v NestedActionContainer_root__1jtfr event-card event-card__vertical vertical-event-card__action-visibility">
                <a href="https://www.eventbrite.com/e/free-cancer-camp-at-apollomedics-hospital-lucknow-tickets-922054197927?aff=ebdssbcitybrowse" rel="noopener" target="_blank" class="event-card-link " aria-label="View FREE Cancer Camp at Apollomedics Hospital Lucknow" data-event-id="922054197927" data-event-location="Lucknow, UP" data-event-paid-status="free" data-event-category="health">
                </a>
            </div>
        </section>
    </div>
    <div class="eds-g-cell eds-g-cell--has-overflow eds-g-cell-1-1 feed__card-cell">
        <section class="discover-vertical-event-card" data-testid="home-event-card-793035880667">
            <div class="Container_root__4i85v NestedActionContainer_root__1jtfr event-card event-card__vertical vertical-event-card__action-visibility">
                <a href="https://www.eventbrite.com/e/join-us-at-the-12th-new-normal-education-leadership-summit-awards-2024-tickets-916285844627?aff=ebdssbcitybrowse" rel="noopener" target="_blank" class="event-card-link " aria-label="View Join us at the 12th ‘New Normal – Education Leadership Summit &amp; Awards 2024" data-event-id="916285844627" data-event-location="Lucknow, UP" data-event-paid-status="free" data-event-category="business">
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

let eventData = [];

async function processEvent(event, page) {
    try {
        const query = event;
        console.log("query: " + query);
        const finalQuery = `https://www.google.com/search?q=${encodeURIComponent(query)}&sourceid=chrome&ie=UTF-8`;

        await page.goto(finalQuery, { waitUntil: 'load', timeout: 0 });

        const numResult = await page.evaluate(() => {
            let i = 0;
            const rsoElement = document.getElementById('rso');
            if (rsoElement) {
                rsoElement.childNodes.forEach(element => {
                    if (element.tagName === "DIV") {
                        i++;
                    }
                });
            }
            return i;
        });
        console.log("Results for " + event + ": ", numResult);

        var results = [];

    } catch (error) {
        console.error(error);
    }
}

async function run() {
    try {
        for (const event of eventData) {
            let browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            let query = event.Title;
            await processEvent(query, page);
            await browser.close();
        }
    } catch (error) {
        console.log(error);
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
        let $ = cheerio.load(response);
        let Title = $('div.event-details__main-inner > h1').text().trim();
        let Date = $('span.date-info__full-datetime').text().trim();
        let Location = $('p.location-info__address-text').text().trim();
        let Desc = $('div.eds-text--left > p').text().trim();
        let OrgInfo = $('div[data-testid="read-more-contentx"] p').text().trim();

        eventData.push({
            Title,
            Date,
            Location,
            Desc,
            OrgInfo
        });
    }

    console.log(eventData);

    const j2cp = new Parser();
    const csv = j2cp.parse(eventData);

    fs.writeFileSync("./event.csv", csv, "utf-8");

    run();
};

getLinks();
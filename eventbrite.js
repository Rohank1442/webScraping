const cheerio = require('cheerio');
const request = require('request-promise')
const fs = require('fs')
const json2csv = require('json2csv').Parser;
const puppeteer = require('puppeteer');

// HTML content containing event details
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
    <div class="eds-g-cell eds-g-cell--has-overflow eds-g-cell-1-1 feed__card-cell">
        <section class="discover-vertical-event-card" data-testid="home-event-card-815647422397">
            <div class="Container_root__4i85v NestedActionContainer_root__1jtfr event-card event-card__vertical vertical-event-card__action-visibility">
                <a href="https://www.eventbrite.com/e/entrepreneurs-meetup-by-we-founders-collab-tickets-793035880667?aff=ehometext" rel="noopener" target="_blank" class="event-card-link " aria-label="View Women of Impact Awards 2024" data-event-id="815647422397" data-event-location="Hyderabad, TS" data-event-paid-status="paid" data-event-category="business">
                </a>
            </div>
        </section>
    </div>
</div>
`;

const $ = cheerio.load(htmlContent); // Loading the HTML content into a cheerio instance

const hrefList = []; // Initializing an empty array to store href attributes of anchor tags

// Extracting href attributes of anchor tags
$('a').each((index, element) => {
    hrefList.push($(element).attr('href')); // Pushing href attributes to the hrefList array
});

// console.log(hrefList);

let eventData = []; // Initializing an empty array to store event data

// Asynchronously process each event
async function processEvent(event, page) {
    try {
        const query = event; // Assigning the event to the query variable
        console.log("query: " + query); // Logging the query to the console
        const finalQuery = `https://www.google.com/search?q=${encodeURIComponent(query)}&sourceid=chrome&ie=UTF-8`;

        // Navigating to the Google search results page
        await page.goto(finalQuery, { waitUntil: 'load', timeout: 0 });

        // Evaluating the number of search results
        const numResult = await page.evaluate(() => {
            let i = 0;
            document.getElementById('rso').childNodes.forEach(element => {
                if (element.tagName === "DIV") {
                    i++;
                }
            });
            return i;
        });
        console.log("Results for " + event + ": ", numResult); // Logging the number of search results

        var results = []; // Initializing an empty array to store search result data

        // Looping through each search result
        // for (let index = 1; index <= numResult; index++) {
        //     await page.waitForSelector('//*[@id="rso"]/div[' + index + ']'); // Waiting for the selector to appear in the DOM
        //     var [xpath] = await page.$x('//*[@id="rso"]/div[' + index + ']'); // Finding the XPath of the current search result
        //     var check = await page.evaluate(el => el.getElementByTagName('H3').length, xpath); // Checking if the search result contains an H3 tag
        //     if (check == 1) {
        //         var data = await page.evaluate(el => el.getElementByTagName('H3')[0].innerText, xpath); // Extracting text from the first H3 tag within the search result
        //         results.push(data); // Pushing the extracted data to the results array
        //     }
        // }
        // console.log(results) // Logging the results array
    } catch (error) {
        console.error(error); // Logging any errors that occur
    }
}

// Function to run the processEvent function for each event
async function run() {
    try {
        // Looping through each event
        eventData.forEach(async (event) => {
            let browser = await puppeteer.launch({ headless: true }); // Launching a headless browser instance
            const page = await browser.newPage(); // Creating a new page in the browser
            let query = event.Title // Assigning the title of the event to the query variable
            processEvent(query, page) // Calling the processEvent function to process the event
        });
    }
    catch (error) {
        console.log(error) // Logging any errors that occur
    }
}

// Function to get event links and details
const getLinks = async () => {
    // Looping through each event link
    for (let event of hrefList) {
        // Making an HTTP request to the event URL
        const response = await request({
            uri: event,
            headers: {
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate, br, zstd",
                "Accept-Language": "en-US,en;q=0.9,hi;q=0.8"
            },
        });
        let $ = cheerio.load(response) // Loading the response HTML into a cheerio instance
        let Title = $('div.event-details__main-inner > h1').text(); // Loading the response HTML into a cheerio instance
        let Date = $('span.date-info__full-datetime').text(); // Extracting the event date
        let Location = $('p.location-info__address-text').text(); // Extracting the event location
        let Desc = $('div.eds-text--left > p').text(); // Extracting the event description
        let OrgInfo = $('div[data-testid="read-more-contentx"] p').text(); // Extracting additional organization info

        // Pushing event details to the eventData array
        eventData.push({
            Title,
            Date,
            Location,
            Desc,
            OrgInfo
        });
    }

    const j2cp = new json2csv();  // Creating a new instance of json2csv
    const csv = j2cp.parse(eventData) // Converting eventData to CSV format

    fs.writeFileSync("./event.csv", csv, "utf-8"); // Writing the CSV data to a file

    run(); // Calling the run function to process each event
}

getLinks();
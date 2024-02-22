# Web Scraping with Puppeteer and Cheerio

`Web-Scraping`

This Node.js script scrapes event details from a website using Cheerio and Puppeteer. It extracts event information such as name, date, location, description, and organizer information from a predefined HTML content. Additionally, it enriches the data by performing Google searches based on event names and retrieves additional information from the search results.

**Getting Started**
Follow these instructions to set up and run the script:
**Prerequisites**
  Node.js installed on your machine
  npm or yarn package manager

**Running the project**

1. Clone the repository or download the script files.
2. Navigate to the project directory.
3. Install dependencies using npm or yarn:

Navigate to the project directory.

Install dependencies using npm or yarn:
`npm install` or `yarn install`

1. **Usage**
Ensure that you have the HTML content of the events ready. You can either hardcode it into the script or retrieve it dynamically from a source.

Update the htmlContent variable in the script with your HTML content containing event details.

Run the script using Node.js:
`node eventbrite.js`

the following commands:

1. npm install
1. node app.js -> Backend
1. npm start -> Frontend

The script will extract event details, perform Google searches for each event, and enrich the data with additional information.

The final enriched data will be saved in a structured format such as JSON or CSV in the event.csv file.

**Built With**

This website was built using the following technologies:

Cheerio: ^1.0.0-rc.12
JSON2CSV: ^6.0.0-alpha.2
Puppeteer: ^22.1.0
Request: ^2.88.2
Request-promise: ^4.2.6

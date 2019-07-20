const puppeteer = require("puppeteer");

module.exports = class Scraperizer {
	constructor(searchTerm) {
		this.searchTerm = searchTerm;
	}

	get randomImgNum() {
		return Math.floor(Math.random() * 10) + 2;
	}

	get url() {
		return `https://www.google.com/search?q=${this.searchTerm.replace(
			" ",
			"+",
		)}&tbm=isch`;
	}

	/**
	 * runs puppeteer
	 * @returns a promise that resolves to an array of succesfully scraped imgs
	 * @private
	 */
	async gather() {
		const browser = await puppeteer.launch();
		const page = await browser.newPage();

		await page.goto(this.url);

		// Clicking on a random image to expand it
		// need to do this to get full size image and non-base-64 src
		await page.click(
			`#rg_s > div:nth-child(${this.randomImgNum}) > a.rg_l`,
		);

		// Waiting for click animation to resolve before evaluating
		await page.waitFor(500);

		const res = await page.evaluate(searchTerm => {
			// Querying by alt seems most reliable here
			const nodeList = document.querySelectorAll(
				`img[alt='Image result for ${searchTerm}']`,
			);

			let x = [];

			for (let i = 0; i < nodeList.length; i++) {
				x.push(nodeList[i].src);
			}

			return x;
		}, this.searchTerm);

		await browser.close();

		return await res;
	}

	/**
	 *
	 * @param {string[]} srcList an array of scraped url img srcs
	 * @returns {string[]} a list of img urls
	 * @private
	 */
	filter(srcList) {
		return srcList.filter(src => Boolean(src) && !src.includes("base64"));
	}

	/**
	 *
	 * @param {Object} options options to set
	 * @param {string} options.type either "list" or "one"
	 * @returns {string|string[]} either a url string or an array of url strings
	 */
	async scrape(options = { type: "one" }) {
		const res = await this.gather();
		const list = this.filter(res);

		if (options.type === "list") {
			return list;
		} else if (options.type === "one") {
			return list[0];
		} else {
			throw new Error(
				"options.type param for 'Scraperizer.scrape' can only be 'list', 'one', or null",
			);
		}
	}
};

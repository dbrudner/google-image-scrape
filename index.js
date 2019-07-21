const puppeteer = require("puppeteer");

module.exports = class Scraperizer {
	/**
	 *
	 * @param {string} searchTerm string to search goog images by
	 * @param {Object} [puppeteerSettings] object of puppeteer settings
	 * @constructor
	 */
	constructor(searchTerm, puppeteerSettings = {}) {
		if (!searchTerm) {
			throw new Error("Must initialize with a search term");
		}

		this.searchTerm = searchTerm;
		this.puppeteerSettings = puppeteerSettings;
	}

	/**
	 *
	 * @param {number} max
	 * @param {number} [offset]
	 * @returns {number} a random num given the params
	 * @private
	 */
	randomNum(max, offset = 0) {
		return Math.floor(Math.random() * max) + offset;
	}

	get url() {
		return `https://www.google.com/search?q=${this.searchTerm.replace(
			" ",
			"+"
		)}&tbm=isch`;
	}

	/**
	 * runs puppeteer
	 * @returns {Promise<string[]>} a promise that resolves to either a url string or an array of url strings
	 * @private
	 */
	async gather() {
		const browser = await puppeteer.launch(this.puppeteerSettings);
		const page = await browser.newPage();

		await page.goto(this.url);

		// Clicking on a random image to expand it
		// need to do this to get full size image and non-base-64 src
		const n = this.randomNum(10, 2);

		await page.click(`#rg_s > div:nth-child(${n}) > a.rg_l`);

		// Waiting for click animation to resolve before evaluating
		await page.waitFor(500);

		const res = await page.evaluate(searchTerm => {
			// Querying by alt seems most reliable here
			const nodeList = document.querySelectorAll(
				`img[alt='Image result for ${searchTerm}']`
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
	 * @param {string[]} urlList self-explanatory
	 * @param {boolean} [includeBase64] option to include base-64 strings in results
	 * @private
	 */
	filterList(urlList, includeBase64) {
		// ternaries are for savages
		if (includeBase64) {
			return urlList.filter(Boolean);
		}

		return res.filter(x => Boolean(x) && !x.includes("base64"));
	}

	/**
	 *
	 * @param {Object} options options to set
	 * @param {string} [options.type] either "list" or "one"
	 * @param {boolean} [options.includeBase64] option to include base-64 strings in results
	 * @param {boolean} [options.preferNonBase64] if list === 'one', try to return non base-64 string and fallback to base-64 otherwise. Future feature, I'm cool with not having this rn.
	 * @returns {Promise<string|string[]>} a promise that resolves to either a url string or an array of url strings
	 */
	async scrape({
		type = "one",
		includeBase64 = true,
		preferNonBase64 = true
	} = {}) {
		const urlList = await this.gather();

		if (!urlList.length) {
			throw new Error("No images found.");
		}

		const filteredList = this.filterList(urlList, includeBase64);

		if (type === "list") {
			return filteredList;
		} else if (type === "one") {
			return filteredList[this.randomNum(filteredList.length)];
		} else {
			throw new Error(
				"options.type param for 'Scraperizer.scrape' can only be 'list', 'one', or null"
			);
		}
	}
};

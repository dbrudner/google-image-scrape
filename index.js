const puppeteer = require("puppeteer");

const scrape = async searchTerm => {
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();
	await page.goto(
		`https://www.google.com/search?q=${searchTerm.replace(
			" ",
			"+",
		)}&tbm=isch`,
	);

	const n = Math.floor(Math.random() * 10) + 2;

	await page.click(`#rg_s > div:nth-child(${n}) > a.rg_l`);

	await page.waitFor(500);

	const res = await page.evaluate(searchTerm => {
		const nodeList = document.querySelectorAll(
			`img[alt='Image result for ${searchTerm}']`,
		);

		let x = [];

		for (let i = 0; i < nodeList.length; i++) {
			x.push(nodeList[i].src);
		}

		return x;
	}, searchTerm);

	await browser.close();
	return await res;
};

(async () => {
	const res = await scrape("grumpy cat");

	console.log({
		result: res.filter(Boolean).filter(x => !x.includes("base64")),
	});
})();

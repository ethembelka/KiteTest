/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/
const {By, Key, until} = require('selenium-webdriver');
const {waitAround, getPixelSumByIndexScript} = require('../util/TestUtils');
const ONE_SECOND = 1000;
module.exports =  class BasePage {

	constructor(driver) {
		this.driver = driver;
	}

	/**
	 * Locates an element
	 * Assuming that the element is being declared as :
	 * const username = By.id('user-name')
	 * could be By. something else (xpath, tagName,...)
	 * @param {By} selector for element
	 * @returns {Promise}
	 */
	async get(selector) {
		await this.waitForElement(selector);
		return this.driver.findElement(selector);
	}

	/**
	 * Navigates to the url and wait for the page to be ready
	 * @param {String} url Reference to the Step object
	 * @param {Number} timeout Time in s before it timeout
	 */
	async open (url, timeout) {
		await this.driver.get(url);
		await this.waitForPage(timeout);
	}

	/**
	 * Navigates to the url and wait for the page to be ready
	 * @returns {Promise<String>>}
	 */
	async currentUrl () {
		return  this.driver.getCurrentUrl();
	}

	async switchWindowHandler() {
		let currentHandle = await this.driver.getWindowHandle();
		let handles = await this.driver.getAllWindowHandles();
		let handle;
		for (handle of handles) {
			if (handle !== currentHandle) {
				return this.driver.switchTo().window(handle);
			}
		}
	}

	/**
	 * Waits for page to be ready
	 * @param {Number} timeout Time in s before it timeout
	 */
	async waitForPage ( timeout) {
		await this.driver.wait(this.isDocumentReady(), timeout * ONE_SECOND);
	}

	/**
	 * Checks if the state the document is "complete"
	 * @returns {Boolean}
	 */
	async isDocumentReady() {
		return await this.driver.executeScript("return document.readyState") === "complete";
	}

	/**
	 * Clears existing text on element
	 * @param {By} selector for element
	 * @returns {Promise}
	 */
	async clearText(selector) {
		try {
			let element = await this.driver.findElement(selector);
			return element.clear();
		} catch (e) {
			console.log("Could not clear text of: " + selector, e);
		}
	}

	/**
	 * Sends text to element
	 * @param {By} selector for element
	 * @param {String} value to send to element
	 * @returns {Promise}
	 */
	async sendKeys(selector, value) {
		try{
			let element = await this.driver.findElement(selector);
			return element.sendKeys(value);
		} catch (e) {
			console.log("Could not send text to: " + selector, e);
		}
	}

	/**
	 * Clicks on element
	 * @param {By} selector for element
	 * @returns {Promise}
	 */
	async click(selector) {
		try{
			let element = await this.driver.findElement(selector);
			return element.click();
		} catch (e) {
			console.log("Could not send text to: " + selector, e);
		}
	}

	/**
	 * Waits for element to be located
	 * @param {By} selector for element
	 * @returns {Promise}
	 */
	async waitForElement(selector) {
		return this.driver.wait(until.elementLocated(selector), 5000);
	}

	async resize(h, w) {
		return this.driver.manage().window().setRect({height:h, width: w, x:0, y:0});
	}

	/**
	 * Verifies whether element exists and is visible
	 * @param {By} selector for element
	 * @returns {Boolean}
	 */
	async isVisible(selector) {
		try {
			let element = await this.get(selector);
			return (typeof element !== "undefined") && await element.isDisplayed();
		} catch (e) {
			return false;
		}
	}

	/**
	 * Verifies whether video displays correctly
	 * @param {Number} index of the video in page's video array
	 * @param {Number} timeout before the check timeout
	 * @returns {String} 'blank' || 'still' || 'video'
	 */
	async videoCheck(index, timeout) {
		console.log('Checking video (' + index + ')');

		// Check the status of the video
		// result = 'blank' || 'still' || 'video'
		let i = 0;
		let result = await this.verifyVideoDisplayByIndex(index);
		while(result === 'blank' || typeof result === "undefined" && i < timeout) {
			result = await this.verifyVideoDisplayByIndex(this.driver, index);
			i++;
			await waitAround(ONE_SECOND);
		}

		i = 0;
		while(i < 3 && result !== 'video') {
			result = await this.verifyVideoDisplayByIndex(index);
			i++;
			await waitAround(3 * ONE_SECOND); // waiting 3s after each iteration
		}
		return result;
	}

	/**
	 * Verifies whether video displays correctly
	 * @param {Number} index of the video in page's video array
	 * @returns {String} 'blank' || 'still' || 'video'
	 */
	async verifyVideoDisplayByIndex (index) {
		const sumArray = [];
		let videoCheck = 'video';
		const sum1 = await this.driver.executeScript(getPixelSumByIndexScript(index));
		sumArray.push(sum1);
		await waitAround(ONE_SECOND);
		const sum2 = await this.driver.executeScript(getPixelSumByIndexScript(index));
		sumArray.push(sum2);

		if (sumArray.length === 0 || sumArray.includes(0)) {
			videoCheck = 'blank';
			//throw new Error('The video was blank at the moment of checking');
		} else {
			if (Math.abs(sumArray[0] - sumArray[1]) === 0) {
				videoCheck = 'still';
				//throw new Error('The video was still at the moment of checking');
			}
			console.log('Verified video display for video[' + index + '] successfully with ' + sumArray[0] + ' and ' + sumArray[1]);
		}
		return videoCheck;
	}
}
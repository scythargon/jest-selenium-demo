const { Builder, By, until } = require("selenium-webdriver");

jest.setTimeout(3 * 60 * 1000);

/**
 * Selenium connection credentials.
 */
const cbtHub = "http://hub.crossbrowsertesting.com:80/wd/hub";

const cbtKeys = {
    username: "***",
    password: "***",
};

const keysToUse = cbtKeys;
const hubToUse = cbtHub;

/**
 * Some constants for easy test config creations.
 */

const platforms = {
    windows10: "Windows 10",
    windows81: "Windows 8.1",
};

const browsers = {
    chrome: "Chrome",
    IE: "Internet Explorer",
};

const defaultCaps = {
    record_video: "true",
    record_network: "false",
};

/**
 * Test function to run on the loaded page.
 * Looks for a specific element.
 */
function findTeser() {
    return document.querySelector("family-assets-chat")
        && document.querySelector("family-assets-chat").shadowRoot
        && document.querySelector("family-assets-chat").shadowRoot.querySelector(".teaser");
}

/**
 * Turn function into timed out promise.
 */
function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Compose a human readable test name from the provided credentials.
 */
function getTestName(opts) {
    const name = `${opts.prefix || ""} ${opts.browserName} ${ opts.version || opts.browser_version || "" } on ${opts.platform || opts.deviceName || `${opts.os} ${opts.os_version}`}`;
    // console.log(name);
    return name;
}

/**
 * Main entrypoint.
 * Connect to a remote selenium, run the test there and handle the result.
 * @param opts
 * @param authKeys
 * @param hub
 * @returns {Promise<boolean>}
 */
async function runSeleniumTest(opts = {}, authKeys = keysToUse, hub = hubToUse) {
    const testName = getTestName(opts);

    const caps = {...defaultCaps, ...authKeys, ...opts, name: testName,};

    console.log(`Running ${testName}`);

    const driver = new Builder().usingServer(hub).withCapabilities(caps).build();

    let result = false;

    try {
        console.log("loading the page");
        await driver.get("http://chat.scythargon.ru/?staticConfig=1");
        console.log("page loaded");

        await driver.getTitle().then(function (title) {
            console.log(`The title is: ${title}`);
        });

        await driver.wait(
            until.elementLocated(By.css("family-assets-chat")),
            20000,
            "Looking for element"
        );
        const fa_elem = await driver.findElement(By.css("family-assets-chat"));
        console.log("family-assets-chat element found:", Boolean(fa_elem));

        if (fa_elem) {
            await timeout(2000);
            await driver.executeScript(findTeser).then(function (teaser_elem) {
                console.log("shadowRoot teaser found:", Boolean(teaser_elem));
                result = Boolean(teaser_elem);
            });
        }
    } catch (err) {
        console.error("Something went wrong!\n", err.stack, "\n");
    } finally {
        await driver.quit();
    }

    return result;
}

/**
 * Run tests on 3 different platforms.
 */

it("it runs cbt Chrome Selenium test fine", async () => {
    await expect(
        runSeleniumTest({
            version: "70",
            platform: platforms.windows10,
            browserName: browsers.chrome,
        })
    ).resolves.toBe(true);
});

it("it runs cbt IE Selenium test fine", async () => {
    await expect(
        runSeleniumTest({
            platform: platforms.windows81,
            browserName: browsers.IE,
            version: "11",
        })
    ).resolves.toBe(true);
});

it("it runs cbt Safari iPhone 7 Plus Simulator test fine", async () => {
    await expect(
        runSeleniumTest(
            {
                browserName: "Safari",
                deviceName: "iPhone 7 Plus Simulator",
                platformVersion: "10.0",
                platformName: "iOS",
                deviceOrientation: "portrait",
            },
        )
    ).resolves.toBe(true);
});

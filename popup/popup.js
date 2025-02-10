async function loadContainers() {
    // Found every container in browser storage
    const containers = await browser.contextualIdentities.query({});

    let content = "";

    // Display no container found
    if (containers.length === 0) {
        content = "<div class='no-containers'>No container (make sure you are using Firefox Multi-account containers extension)</div>";
    }

    // Generate container html
    containers.forEach(c => {
        content += "<div class='container'>"
        content += "<div class='container-name'><span style='border-bottom-color: "+ c.color +"'>" + c.name + "</span></div>"
        content += "<div class='container-actions'>" +
            "<button class='button close' data-container='" + c.cookieStoreId + "'>close</button>" +
            "<button class='button open' data-container='" + c.cookieStoreId + "'>restore</button>" +
            "</div>"
        content += "</div>"
    });

    document.getElementById("popup-content").innerHTML = content;
}

/**
 * Function to save all tabs for a container and close them
 */
async function saveAndCloseContainer(container) {
    console.log("save and close tabs for container " + container);

    const tabs = await browser.tabs.query({cookieStoreId: container});
    // Try to sort by index and map in short tab object
    // The sort is not "optimal" since tabs can be on different windows
    const tabsToSave = tabs.sort((a, b) => a.index - b.index).map(t => ({
        pinned: t.pinned,
        url: t.url,
        cookieStoreId: container
    }));

    // Do nothing if there is no tab to save/close for this container
    if (tabsToSave.length === 0) {
        showMessage("warning", "No tabs to save");
        return;
    }

    // Set the tabs into local storage
    // Suggestion: maybe sync? would be amazing lol
    browser.storage.local.set({
        ["savedTabs-" + container]: tabsToSave
    });

    // Close the tabs
    await browser.tabs.remove(tabs.map(t => t.id));

    showMessage("success", tabsToSave.length + " tabs closed and saved into storage");
}

/**
 * Function to set and show a message
 */
function showMessage(messageClass, message) {
    document.querySelector("#message").innerHTML = message;
    document.querySelector("#message").classList.add(messageClass);
    document.querySelector("#message").classList.remove("hide");

    removeMessage();
}

/**
 * Function to remove and reset the message container
 */
function removeMessage() {
    setTimeout(function () {
        document.querySelector("#message").classList.add("hide");
        document.querySelector("#message").classList.remove("success", "warning");
    }, 2000);
}

/**
 * Function to re-open all tabs previously closed
 */
async function openContainer(container) {
    console.log("open saved tabs for container " + container);
    const store = await browser.storage.local.get("savedTabs-" + container);
    const tabs = store["savedTabs-" + container] || [];

    if (tabs.length === 0) {
        showMessage("warning", "No tabs restored (0 found)");
        return;
    }

    tabs.forEach(t => browser.tabs.create(t));

    showMessage("success", tabs.length + " tabs restored");
}

/**
 * Listener for clicks
 */
document.addEventListener("click", async (e) => {
    // Make sure we click on a button
    if (!e.target.classList.contains("button")) {
        e.stopPropagation();
        return;
    }

    // Get container clicked
    const container = e.target.dataset.container;

    // Handle save/close tabs
    if (e.target.classList.contains("close")) {
        await saveAndCloseContainer(container);
    }
    // Handle open tabs
    else if (e.target.classList.contains("open")) {
        await openContainer(container);
    }
});

loadContainers();

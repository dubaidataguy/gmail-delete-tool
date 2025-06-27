// Configuration
const maxEmailCount = "ALL_EMAILS"; // Set to a number (e.g., 500) or "ALL_EMAILS" to delete all
const ELEMENT_SELECTORS = {
    checkboxClass: 'div[role="checkbox"]', // Updated selector for Gmail checkboxes
    selectAllCheckbox: 'div[role="checkbox"][aria-label="Select all"]', // Select All checkbox
    deleteButton: 'div[aria-label="Delete"]', // Delete button
    confirmationButton: 'button[name="ok"]' // Confirmation button (if needed)
};

const TIME_CONFIG = {
    delete_cycle: 12000, // Increased to 12 seconds to handle slow loading
    press_button_delay: 3000 // Increased to 3 seconds for reliability
};

const MAX_RETRIES = 1000;

let emailCount = 0;
let checkboxes;
let buttons = {
    deleteButton: null,
    confirmationButton: null
};

// Check if in correct Gmail view
if (!window.location.href.includes('mail.google.com/mail/u/1/#promotions')) {
    console.error("[ERROR] Script must run in Gmail inbox or folder (e.g., #inbox, #trash). Current URL:", window.location.href);
    throw new Error("Invalid page context");
}

let deleteTask = setInterval(async () => {
    let attemptCount = 1;

    // Wait for checkboxes to load
    try {
        checkboxes = document.querySelectorAll(ELEMENT_SELECTORS.checkboxClass);
        while (checkboxes.length === 0 && attemptCount++ < MAX_RETRIES) {
            console.log(`[INFO] Attempt ${attemptCount}: Waiting for checkboxes...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            checkboxes = document.querySelectorAll(ELEMENT_SELECTORS.checkboxClass);
        }

        if (checkboxes.length === 0) {
            console.log("[INFO] No emails found. Check selector or ensure emails are loaded.");
            clearInterval(deleteTask);
            console.log("[SUCCESS] Script exited.");
            return;
        }

        // Select all emails using the "Select All" checkbox
        let selectAllCheckbox = document.querySelector(ELEMENT_SELECTORS.selectAllCheckbox);
        if (selectAllCheckbox) {
            selectAllCheckbox.click();
            console.log("[INFO] Select All checkbox clicked");
            // Wait for checkboxes to update after selecting all
            await new Promise(resolve => setTimeout(resolve, 1000));
            checkboxes = document.querySelectorAll(ELEMENT_SELECTORS.checkboxClass + '[aria-checked="true"]');
        } else {
            console.log("[INFO] Select All checkbox not found, selecting individual emails");
            checkboxes.forEach(checkbox => checkbox.click());
        }

        emailCount += checkboxes.length;
        console.log(`[INFO] Selected ${checkboxes.length} emails`);

        // Click the delete button
        setTimeout(() => {
            try {
                buttons.deleteButton = document.querySelector(ELEMENT_SELECTORS.deleteButton);
                if (!buttons.deleteButton) throw new Error("Delete button not found");
                buttons.deleteButton.click();
                console.log(`[INFO] Delete button clicked for ${checkboxes.length} emails`);
            } catch (error) {
                console.error("[ERROR] Failed to click delete button:", error.message);
                clearInterval(deleteTask);
                console.log("[ERROR] Script exited due to error.");
                return;
            }

            // Optional: Handle confirmation dialog if it appears
            /*
            setTimeout(() => {
                try {
                    buttons.confirmationButton = document.querySelector(ELEMENT_SELECTORS.confirmationButton);
                    if (buttons.confirmationButton) {
                        buttons.confirmationButton.click();
                        console.log("[INFO] Confirmation button clicked");
                    }
                } catch (error) {
                    console.error("[ERROR] Failed to click confirmation button:", error);
                }
            }, TIME_CONFIG.press_button_delay);
            */

            console.log(`[INFO] ${emailCount}/${maxEmailCount} emails deleted`);
            if (maxEmailCount !== "ALL_EMAILS" && emailCount >= parseInt(maxEmailCount)) {
                console.log(`[SUCCESS] ${emailCount} emails deleted as requested`);
                clearInterval(deleteTask);
                console.log("[SUCCESS] Script exited.");
                return;
            }

            // Scroll to load more emails
            window.scrollTo(0, document.body.scrollHeight);
            console.log("[INFO] Scrolled to load more emails");
        }, TIME_CONFIG.press_button_delay);
    } catch (error) {
        console.error("[ERROR] Unexpected error in deletion cycle:", error.message);
        clearInterval(deleteTask);
        console.log("[ERROR] Script exited due to error.");
    }
}, TIME_CONFIG.delete_cycle);

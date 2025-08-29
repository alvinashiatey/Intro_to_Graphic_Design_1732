import { registerSW } from "virtual:pwa-register";

// This will be replaced at build time with actual values
const CURRENT_VERSION = "1.0.0";
const VERSION_CHECK_INTERVAL = 1000 * 60 * 60; // Check every hour

// Create and register the toast container
function createToastContainer() {
  const container = document.createElement("div");
  container.className = "toast-container";
  document.body.appendChild(container);
  return container;
}

// Toast notification function
function showToast(message: string, duration = 5000) {
  const toastContainer =
    document.querySelector(".toast-container") || createToastContainer();

  const toast = document.createElement("div");
  toast.className = "toast";

  toast.innerHTML = `
    <div class="toast-message">${message}</div>
    <button class="toast-close">&times;</button>
  `;

  toastContainer.appendChild(toast);

  // Force reflow
  void toast.offsetWidth;

  // Make visible
  setTimeout(() => toast.classList.add("visible"), 10);

  // Set up close button
  toast.querySelector(".toast-close")?.addEventListener("click", () => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300);
  });

  // Auto-remove after duration
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);

  return toast;
}

// Show a browser notification if permission is granted
function showBrowserNotification(title: string, message: string) {
  if (Notification.permission === "granted") {
    // Create and show the notification
    const notification = new Notification(title, {
      body: message,
      icon: "/icons/icon-192x192.png",
    });

    // Handle notification click
    notification.onclick = function () {
      window.focus();
      notification.close();
    };

    return true;
  }
  return false;
}

// Check for updates by comparing versions
function checkForUpdates() {
  // Fetch version.json with cache-busting query param
  fetch("/version.json?" + new Date().getTime())
    .then((response) => response.json())
    .then((data) => {
      const storedVersion =
        localStorage.getItem("site-version") || CURRENT_VERSION;

      if (data.version !== storedVersion) {
        // Try to show browser notification first
        showBrowserNotification(
          "Course Website Updated",
          "The course website has been updated with new content."
        );

        // Always show toast as fallback or additional notification
        showToast(
          `The course website has been updated! <a href="javascript:window.location.reload()">Refresh</a> to see the latest content.`
        );

        localStorage.setItem("site-version", data.version);
      }
    })
    .catch((error) => console.error("Error checking for updates:", error));
}

// Handle notification permissions intelligently
function handleNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return;
  }

  // First website visit - store that we've seen the user before
  if (!localStorage.getItem("pwa-user-seen")) {
    localStorage.setItem("pwa-user-seen", "true");
    localStorage.setItem("pwa-notification-prompted", "false");
    return; // Don't prompt on first visit
  }

  // If permission is already granted or denied, don't do anything
  if (
    Notification.permission === "granted" ||
    Notification.permission === "denied"
  ) {
    return;
  }

  // Check if we've prompted before
  const hasPrompted =
    localStorage.getItem("pwa-notification-prompted") === "true";

  // If we haven't prompted yet, and user has visited multiple times, show contextual toast
  if (!hasPrompted && localStorage.getItem("pwa-user-seen") === "true") {
    // We'll show this notification only after the user has been on the site for a while
    setTimeout(() => {
      showPermissionToast();
    }, 30000); // Show after 30 seconds on the page
  }
}

// Show a contextual toast asking for notification permission
function showPermissionToast() {
  const toast = showToast(
    `Would you like to be notified when this course website is updated? 
    <a href="javascript:void(0)" id="enable-notifications">Enable notifications</a>`,
    0 // Don't auto-dismiss
  );

  document
    .getElementById("enable-notifications")
    ?.addEventListener("click", () => {
      // Mark that we've prompted the user
      localStorage.setItem("pwa-notification-prompted", "true");

      // Request permission
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          showToast(
            "You will now receive notifications when the site is updated."
          );
        }

        // Remove the permission toast
        toast.classList.remove("visible");
        setTimeout(() => toast.remove(), 300);
      });
    });
}

// Initialize the PWA functionality
export function initPWA() {
  // Add CSS for toasts
  const style = document.createElement("style");
  style.textContent = `
    .toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
    }
    
    .toast {
      background-color: #323232;
      color: #fff;
      padding: 16px 24px;
      border-radius: 4px;
      margin-bottom: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 350px;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s ease-out;
    }
    
    .toast.visible {
      transform: translateY(0);
      opacity: 1;
    }
    
    .toast-message {
      margin-right: 10px;
    }
    
    .toast-close {
      cursor: pointer;
      background: none;
      border: none;
      color: white;
      font-size: 18px;
    }
    
    .toast-message a {
      color: #ffffff;
      text-decoration: underline;
      font-weight: bold;
    }
    
    .toast-message a:hover {
      text-decoration: none;
    }

    .app-installed-banner {
      background-color: #f1f1f1;
      padding: 10px;
      margin-bottom: 20px;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .app-installed-banner button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
    }
  `;
  document.head.appendChild(style);

  // Register service worker with update handler
  const updateSW = registerSW({
    onNeedRefresh() {
      showToast(
        `New content is available. <a href="javascript:void(0)" id="update-sw">Update now</a>`,
        0
      );
      document.getElementById("update-sw")?.addEventListener("click", () => {
        updateSW(true);
      });
    },
    onOfflineReady() {
      showToast("Site is ready for offline use.");
    },
  });

  // Check for updates when page loads and periodically
  checkForUpdates();
  setInterval(checkForUpdates, VERSION_CHECK_INTERVAL);

  // Handle notifications intelligently
  window.addEventListener("load", () => {
    // Wait a bit for the page to settle before checking notification permission
    setTimeout(() => {
      handleNotificationPermission();
    }, 2000);
  });
}

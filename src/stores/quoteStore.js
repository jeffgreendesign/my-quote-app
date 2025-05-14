// src/stores/quoteStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";

// Define the store, naming it 'quote'
export const useQuoteStore = defineStore("quote", () => {
  // --- State ---
  const currentQuote = ref(null); // Holds the quote object { content, author, tags }
  const isLoading = ref(false); // Tracks if an API call is in progress
  const errorMessage = ref(null); // Holds any error message from the API call

  // --- Getters ---
  // Checks if we have a valid quote object
  const hasQuote = computed(() => {
    return (
      currentQuote.value !== null &&
      typeof currentQuote.value.content === "string"
    );
  });

  // Formats the tags array into a nice string
  const formattedTags = computed(() => {
    if (
      hasQuote.value &&
      currentQuote.value.tags &&
      currentQuote.value.tags.length > 0
    ) {
      return currentQuote.value.tags.join(", "); // e.g., "technology, inspiration"
    }
    return ""; // Return empty string if no tags
  });

  // --- Actions ---
  async function fetchRandomQuote() {
    isLoading.value = true;
    errorMessage.value = null;
    currentQuote.value = null; // Clear previous quote

    try {
      // Determine if we're in development or production
      const isDevelopment = import.meta.env.DEV;
      const fetchUrl = isDevelopment
        ? "/api/v1/quotes" // Development: Use Vite proxy
        : "/.netlify/functions/get-quote"; // Production: Use Netlify function

      console.log("Fetching from:", fetchUrl); // Debug log
      const response = await fetch(fetchUrl);
      console.log("Fetch response status:", response.status); // Debug log

      if (!response.ok) {
        // Attempt to read error message from API if available
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // Ignore if response body is not JSON
        }
        const errorMsgDetail =
          errorData?.error ||
          errorData?.message ||
          `Status: ${response.status}`;
        console.error("API Error Response:", errorData); // Debug log
        throw new Error(`API error! ${errorMsgDetail}`);
      }

      const data = await response.json();
      console.log("API Data received:", data); // Debug log

      // In production, the Netlify function returns a single quote object
      // In development, we get an array with one quote
      const quoteData = isDevelopment ? data[0] : data;

      if (quoteData) {
        currentQuote.value = {
          content: quoteData.quote,
          author: quoteData.author || "Unknown", // Default if author is null/empty
          tags: quoteData.category ? [quoteData.category] : [],
        };
      } else {
        throw new Error("Received no quote data from API");
      }
    } catch (error) {
      console.error("Failed to fetch quote (Catch Block):", error);
      errorMessage.value = `Oops! Could not fetch quote: ${
        error.message || "Please try again."
      }`;
      currentQuote.value = null; // Ensure no stale quote is shown on error
    } finally {
      isLoading.value = false;
    }
  }

  // --- Return ---
  // Make state, getters, and actions available to components
  return {
    currentQuote,
    isLoading,
    errorMessage,
    hasQuote,
    formattedTags,
    fetchRandomQuote,
  };
});

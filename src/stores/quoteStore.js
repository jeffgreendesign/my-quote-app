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
      // *** CHANGED: URL points to our proxy for API Ninjas + limit=1 ***
      const fetchUrl = "/api/v1/quotes?";
      console.log("Fetching from:", fetchUrl); // Debug log
      const response = await fetch(fetchUrl);
      console.log("Fetch response status:", response.status); // Debug log

      if (!response.ok) {
        // Attempt to read error message from API Ninjas if available
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // Ignore if response body is not JSON
        }
        const errorMsgDetail =
          errorData?.message ||
          errorData?.error ||
          `Status: ${response.status}`;
        console.error("API Error Response:", errorData); // Debug log
        throw new Error(`API error! ${errorMsgDetail}`);
      }

      const data = await response.json(); // Returns an array: [{ quote, author, category }]
      console.log("API Data received:", data); // Debug log

      if (data && data.length > 0) {
        const quoteData = data[0]; // Get the first (only) quote object

        // *** CHANGED: Map response fields (quote, author, category) ***
        currentQuote.value = {
          content: quoteData.quote,
          author: quoteData.author || "Unknown", // Default if author is null/empty
          // *** CHANGED: Map 'category' to 'tags' (as an array) ***
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

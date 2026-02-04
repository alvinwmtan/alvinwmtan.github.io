import { highlightSearchTerm } from "./highlight-search-term.js";

document.addEventListener("DOMContentLoaded", function () {
  // actual bibsearch logic
  const filterItems = (searchTerm) => {
    document.querySelectorAll(".bibliography, .unloaded").forEach((element) => element.classList.remove("unloaded"));

    // highlight-search-term
    if (CSS.highlights) {
      const nonMatchingElements = highlightSearchTerm({ search: searchTerm, selector: ".bibliography > li" });
      if (nonMatchingElements == null) {
        return;
      }
      nonMatchingElements.forEach((element) => {
        element.classList.add("unloaded");
      });
    } else {
      // Simply add unloaded class to all non-matching items if Browser does not support CSS highlights
      document.querySelectorAll(".bibliography > li").forEach((element, index) => {
        const text = element.innerText.toLowerCase();
        if (text.indexOf(searchTerm) == -1) {
          element.classList.add("unloaded");
        }
      });
    }

    document.querySelectorAll("h2.bibliography").forEach(function (element) {
      let iterator = element.nextElementSibling; // get next sibling element after h2, which can be h3 or ol
      let hideFirstGroupingElement = true;
      // iterate until next group element (h2), which is already selected by the querySelectorAll(-).forEach(-)
      while (iterator && iterator.tagName !== "H2") {
        if (iterator.tagName === "OL") {
          const ol = iterator;
          const unloadedSiblings = ol.querySelectorAll(":scope > li.unloaded");
          const totalSiblings = ol.querySelectorAll(":scope > li");

          if (unloadedSiblings.length === totalSiblings.length) {
            ol.previousElementSibling.classList.add("unloaded"); // Add the '.unloaded' class to the previous grouping element (e.g. year)
            ol.classList.add("unloaded"); // Add the '.unloaded' class to the OL itself
          } else {
            hideFirstGroupingElement = false; // there is at least some visible entry, don't hide the first grouping element
          }
        }
        iterator = iterator.nextElementSibling;
      }
      // Add unloaded class to first grouping element (e.g. year) if no item left in this group
      if (hideFirstGroupingElement) {
        element.classList.add("unloaded");
      }
    });
  };

  // Get all unique tags from bibliography entries
  const getAllTags = () => {
    const tagsSet = new Set();
    document.querySelectorAll("[data-tags]").forEach((element) => {
      const tagsAttr = element.getAttribute("data-tags");
      if (tagsAttr) {
        tagsAttr.split(",").forEach((tag) => {
          tagsSet.add(tag.trim().toLowerCase());
        });
      }
    });
    return Array.from(tagsSet).sort();
  };

  // Create tag filter buttons
  const createTagFilters = () => {
    const tags = getAllTags();
    if (tags.length === 0) return;

    const tagContainer = document.getElementById("tag-filters");
    if (!tagContainer) return;

    tagContainer.innerHTML = ""; // Clear existing tags

    tags.forEach((tag) => {
      const tagButton = document.createElement("button");
      tagButton.className = "tag-filter btn btn-sm mr-2 mb-2";
      tagButton.textContent = tag;
      tagButton.setAttribute("data-tag", tag);
      tagButton.addEventListener("click", function () {
        this.classList.toggle("active");
        updateFilters();
      });
      tagContainer.appendChild(tagButton);
    });
  };

  // Get currently selected tags
  const getSelectedTags = () => {
    return Array.from(document.querySelectorAll(".tag-filter.active"))
      .map((btn) => btn.getAttribute("data-tag"));
  };

  // Update filters based on search term and selected tags
  const updateFilters = () => {
    const searchTerm = document.getElementById("bibsearch").value;
    const selectedTags = getSelectedTags();
    filterItems(searchTerm, selectedTags);
  };

  const updateInputField = () => {
    const hashValue = decodeURIComponent(window.location.hash.substring(1)); // Remove the '#' character
    document.getElementById("bibsearch").value = hashValue;
    filterItems(hashValue);
  };

  // Sensitive search. Only start searching if there's been no input for 300 ms
  let timeoutId;
  document.getElementById("bibsearch").addEventListener("input", function () {
    clearTimeout(timeoutId); // Clear the previous timeout
    const searchTerm = this.value.toLowerCase();
    timeoutId = setTimeout(filterItems(searchTerm), 300);
  });

  window.addEventListener("hashchange", updateInputField); // Update the filter when the hash changes

  updateInputField(); // Update filter when page loads
});

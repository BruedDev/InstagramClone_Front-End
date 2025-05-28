// src/utils/storyLocalStorage.ts
const VIEWED_STORY_AUTHORS_KEY = "viewedStoryAuthors";

export const getViewedAuthors = (): string[] => {
  try {
    const item = window.localStorage.getItem(VIEWED_STORY_AUTHORS_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error("Error reading viewed authors from localStorage", error);
    return [];
  }
};

export const addViewedAuthor = (authorId: string): void => {
  try {
    const currentViewed = getViewedAuthors();
    if (!currentViewed.includes(authorId)) {
      const newViewed = [...currentViewed, authorId];
      window.localStorage.setItem(VIEWED_STORY_AUTHORS_KEY, JSON.stringify(newViewed));
    }
  } catch (error) {
    console.error("Error saving viewed author to localStorage", error);
  }
};
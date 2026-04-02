export const NANO_BANANA_PROMPTS = {
  /**
   * Generates a structural and optimized prompt for Nano Banana 2
   * @param {string} userPrompt - Original user input
   * @param {string} type - 'cover' or 'body'
   * @param {string} aspectRatio - '1:1', '4:5', '9:16'
   * @returns {string} Combined structural prompt
   */
  getDesignPrompt: (userPrompt, type = 'cover', aspectRatio = '1:1') => {
    const typeLabel = type.toUpperCase();
    const typeDescription = type === 'cover' ? 'COVER' : 'BODY';
    
    return `
You are a professional card news designer. Generate premium, high-end, and minimalist card news. 

This is the main ${typeDescription} image for a card news series.
Aspect ratio of ${aspectRatio}

Subject: "${userPrompt}"
    `.trim();
  }
};

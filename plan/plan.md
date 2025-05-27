Revised Prompts for Gemini Code Assist (Focus: UI/UX & Flow)
General Instruction (Remind the Chat):

"We are building the Kaka Shopify app. We are now focusing on building the user interface and flow within the Shopify Admin using @shopify/polaris components. We will defer print-on-demand for now. Our goal is a seamless user experience, following the user flow research provided."

1. Building the App Layout & Navigation:

Prompt: "Modify app/routes/app.jsx (if it exists, otherwise create it) to act as the main layout for our embedded app. It should use @shopify/polaris Frame, TopBar, and Navigation components. The Navigation should have links for 'Create New Story' (linking to /app), 'My Stories' (linking to /app/stories), and 'Settings' (linking to /app/settings). The Outlet from Remix should render inside the Frame."
2. Landing / Story Selection (Step 1 from Research):

Prompt: "Update app/routes/app._index.jsx. This should be the 'Choose Your Adventure' page. Use Polaris Page, BlockStack, and Grid components. Display at least 3-4 LegacyCards. Each card should represent a story theme (e.g., 'The Enchanted Manga', 'The Pixel Realm'), show a placeholder image (use Polaris Thumbnail or Box), a brief description, and a Button labeled 'Start This Adventure'. This button should navigate the user to /app/create/[theme_name] using Remix's useNavigate or Link."
3. Customization Input (Step 2 from Research):

Prompt 1: "Create app/routes/app.create.$theme.jsx. This page will host the story creation form. It should get the theme from the URL parameter. Use Polaris Page and display a ProgressBar or similar visual stepper (Book -> Pencil -> Eye -> Cart) to show progress."
Prompt 2: "Create app/components/StoryCreatorForm.jsx. This component will contain the actual form and receive the theme as a prop.
Use @shopify/polaris Form, FormLayout, TextField (Child Name, Hobbies, etc.).
Add Select or RadioButton groups for 'Age', 'Gender'.
Add a section for 'Book Format' (Radio: Hardcover/Softcover).
Add a basic 'Avatar Builder': Use Select or Thumbnail clicks for 'Skin Tone', 'Hair Style', 'Hair Color'.
Include a Button to 'Generate & Preview Story', which will submit the form using useFetcher to /api/generate-story."
Prompt 3: "In app/routes/app.create.$theme.jsx, render the StoryCreatorForm.jsx. When the fetcher returns a storyId, navigate the user programmatically to /app/preview/[storyId]."
4. Story & AI Backend (No Change, Just Ensure it Returns Data):

(Use previous prompts for api.generate-story.js, gemini.server.js, and supabase.server.js, but ensure the API returns enough data for the preview or at least the storyId).
Prompt (New): "Create app/routes/api.get-story.$storyId.js. This should be a Remix loader function that takes the storyId from the params, calls getStory(storyId) from supabase.server.js, and returns the full story data as JSON."
5. Preview & Review (Step 3 from Research):

Prompt 1: "Create app/routes/app.preview.$storyId.jsx. This page will display the story preview. Use Remix's useLoaderData to fetch the story details from /api/get-story/$storyId. Use a Polaris Page component."
Prompt 2: "Create app/components/BookPreviewer.jsx. It receives storyData as a prop.
Use Polaris Layout for a side-by-side view if possible.
On one side, show a Card with the generated Cover Art (placeholder image for now) and child's name.
On the other side (or below), implement a 'page-turner'. Use a Card to display the current page's text and a placeholder Box for the illustration. Add 'Previous' and 'Next' Buttons to cycle through storyData.pages.
Include an 'Approve & Add to Cart' Button (primary action)."
6. Checkout & Fulfillment (Steps 4 & 5 - Simplified):

Prompt: "In BookPreviewer.jsx, make the 'Approve & Add to Cart' button call the handleAddToCart function (use the previous prompt for this function). This function will add the item to the Shopify cart using AJAX and redirect to the cart."
Prompt: "Revise the webhooks.orders-create.js action (from previous prompts). It should only verify the webhook, find the _StoryID, fetch the story from Supabase, update the story's status to 'Ordered', and maybe (as a future step) trigger a simple notification or email. Remove any PDF/Gelato calls for now."
How to Use These Prompts:

Iterate: Feed these prompts to Gemini Chat one by one. Start with the layout, then the index page, then the creator, etc.
Review & Refine: Examine the Polaris code Gemini suggests. Does it match your vision? Ask for changes: "Can you make that grid have 2 columns on desktop?" or "Use a Modal for the avatar builder instead."
Connect: Ensure the Link and useNavigate calls connect your pages correctly.
Test: Use npm run shopify app dev constantly. After each major component is added, refresh your app in the Shopify Admin and test the flow.
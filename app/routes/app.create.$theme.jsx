import { useParams, useNavigate, useFetcher } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Text,
  ProgressBar,
  BlockStack,
  InlineStack,
  Icon,
  Card,
} from "@shopify/polaris";
import {
  BookIcon,
  EditIcon,
  CheckIcon, // Using CheckIcon - compatible with polaris-icons v8.11.1
} from "@shopify/polaris-icons";
import { useEffect } from "react";
import StoryCreatorForm from "../components/StoryCreatorForm";

// Helper to format theme name for display (e.g., "enchanted-manga" -> "Enchanted Manga")
const formatThemeName = (themeId) => {
  if (!themeId) return "Story";
  return themeId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const progressSteps = [
  { id: "theme", label: "Theme", icon: BookIcon, progress: 0 },
  { id: "customize", label: "Customize", icon: EditIcon, progress: 33 },
  { id: "preview", label: "Preview", icon: CheckIcon, progress: 66 },
  { id: "checkout", label: "Checkout", icon: CheckIcon, progress: 100 },
];

const currentStepId = "customize"; // This page represents the "Customize" step

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    // Forward the form data to the stories API
    const response = await fetch(`${new URL(request.url).origin}/api/v1/stories`, {
      method: 'POST',
      body: await request.formData(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return json({ error: error.details || error.error || 'Story generation failed' });
    }
    
    const data = await response.json();
    
    if (data.success && data.story) {
      // Story generated successfully, redirect to view page
      return redirect(`/app/stories/${data.story.id}`);
    } else {
      return json({ error: 'Story generation failed' });
    }
    
  } catch (error) {
    console.error('Create story action error:', error);
    return json({ error: 'An unexpected error occurred during story generation' });
  }
};

export default function CreateStoryPage() {
  const { theme } = useParams();
  const navigate = useNavigate();
  const fetcher = useFetcher(); // We'll use this later for form submission

  const displayThemeName = formatThemeName(theme);
  const currentProgress =
    progressSteps.find((step) => step.id === currentStepId)?.progress || 33;
  const currentStepIndex = progressSteps.findIndex((s) => s.id === currentStepId);

  // This useEffect will be used in a later step to navigate after story generation
  useEffect(() => {
    if (fetcher.data?.storyId && fetcher.state === "idle") {
      navigate(`/app/preview/${fetcher.data.storyId}`);
    }
    // TODO: Handle fetcher.data?.error if the API returns an error
  }, [fetcher.data, fetcher.state, navigate]);

  return (
    <Page
      title={`Customize Your "${displayThemeName}" Adventure`}
      backAction={{ content: "Choose Theme", url: "/app" }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card roundedAbove="sm">
              <BlockStack gap="200" padding="400">
                <InlineStack align="space-between" blockAlign="center" gap="200" wrap={false}>
                  {progressSteps.map((step, index) => (
                    <InlineStack key={step.id} gap="100" blockAlign="center" vertical>
                      <Icon
                        source={step.icon}
                        tone={index <= currentStepIndex ? "success" : "base"}
                      />
                      <Text
                        variant="bodySm"
                        fontWeight={step.id === currentStepId ? "semibold" : "regular"}
                        tone={index <= currentStepIndex ? "success" : "subdued"}
                      >
                        {step.label}
                      </Text>
                    </InlineStack>
                  ))}
                </InlineStack>
                <ProgressBar progress={currentProgress} size="small" tone="primary" />
              </BlockStack>
            </Card>

            {/* Story Creator Form */}
            <StoryCreatorForm theme={theme} fetcher={fetcher} />

            {fetcher.data?.error && (
              <Text tone="critical">{fetcher.data.error}</Text>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
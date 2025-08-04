import { useLoaderData, useFetcher, useActionData } from "@remix-run/react";
import { useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Icon,
} from "@shopify/polaris";
import {
  WorldMajor,
  MagicMajor,
  RocketMajor,
  FishMajor,
} from "@shopify/polaris-icons";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  // Future: Handle story generation API calls here
  return { message: "Story generation endpoint" };
};

export default function Index() {
  const themes = [
    {
      id: "enchanted-manga",
      title: "Enchanted Manga",
      description: "Magical worlds with anime-style artwork and whimsical adventures",
      previewImages: ["/preview-manga-1.jpg", "/preview-manga-2.jpg"],
      icon: MagicMajor,
      color: "#FF6B9D",
      features: ["Anime-style illustrations", "Fantasy creatures", "Magic spells"]
    },
    {
      id: "underwater-explorer",
      title: "Underwater Explorer",
      description: "Deep sea adventures with colorful marine life and hidden treasures",
      previewImages: ["/preview-underwater-1.jpg", "/preview-underwater-2.jpg"],
      icon: FishMajor,
      color: "#4ECDC4",
      features: ["Ocean exploration", "Marine creatures", "Treasure hunting"]
    },
    {
      id: "space-adventure",
      title: "Space Adventure",
      description: "Cosmic journeys through galaxies with alien friends and spaceships",
      previewImages: ["/preview-space-1.jpg", "/preview-space-2.jpg"],
      icon: RocketMajor,
      color: "#6B73FF",
      features: ["Space exploration", "Alien encounters", "Spaceship adventures"]
    },
    {
      id: "world-explorer",
      title: "World Explorer",
      description: "Cultural adventures around the globe with landmarks and traditions",
      previewImages: ["/preview-world-1.jpg", "/preview-world-2.jpg"],
      icon: WorldMajor,
      color: "#FFA726",
      features: ["Cultural exploration", "World landmarks", "Global traditions"]
    }
  ];

  return (
    <Page title="AI Storybook Generator">
      <Layout>
        <Layout.Section>
          <BlockStack gap="800">
            {/* Hero Section */}
            <Card>
              <BlockStack gap="400" inlineAlign="center">
                <Text variant="displayLarge" alignment="center">
                  Create Magical Stories for Your Child
                </Text>
                <Text variant="bodyLg" alignment="center" tone="subdued">
                  Choose a theme below and let AI generate personalized adventures featuring your child as the hero
                </Text>
              </BlockStack>
            </Card>

            {/* Theme Selection Grid */}
            <Text variant="headingXl">Choose Your Adventure Theme</Text>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {themes.map((theme) => (
                <Card key={theme.id} sectioned>
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="start">
                      <BlockStack gap="200">
                        <InlineStack gap="200" blockAlign="center">
                          <div style={{ 
                            backgroundColor: theme.color + '20', 
                            padding: '8px', 
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Icon source={theme.icon} tone="base" />
                          </div>
                          <Text variant="headingMd">{theme.title}</Text>
                        </InlineStack>
                        <Text tone="subdued">{theme.description}</Text>
                      </BlockStack>
                    </InlineStack>
                    
                    <BlockStack gap="200">
                      <Text variant="bodyMd" fontWeight="semibold">Features:</Text>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {theme.features.map((feature, index) => (
                          <li key={index}>
                            <Text variant="bodySm" tone="subdued">{feature}</Text>
                          </li>
                        ))}
                      </ul>
                    </BlockStack>
                    
                    <Button 
                      primary 
                      fullWidth
                      url={`/app/create/${theme.id}`}
                    >
                      Create {theme.title} Story
                    </Button>
                  </BlockStack>
                </Card>
              ))}
            </div>

            {/* Feature Highlights */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingLg" alignment="center">
                  Why Choose Our AI Storybook Generator?
                </Text>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
                  <BlockStack gap="200" inlineAlign="center">
                    <Icon source={MagicMajor} tone="primary" />
                    <Text variant="headingMd" alignment="center">Personalized Stories</Text>
                    <Text alignment="center" tone="subdued">
                      Every story features your child as the main character with their unique traits and preferences
                    </Text>
                  </BlockStack>
                  <BlockStack gap="200" inlineAlign="center">
                    <Icon source={WorldMajor} tone="primary" />
                    <Text variant="headingMd" alignment="center">Diverse Themes</Text>
                    <Text alignment="center" tone="subdued">
                      Choose from magical adventures, underwater explorations, space journeys, and world discoveries
                    </Text>
                  </BlockStack>
                  <BlockStack gap="200" inlineAlign="center">
                    <Icon source={RocketMajor} tone="primary" />
                    <Text variant="headingMd" alignment="center">AI-Powered</Text>
                    <Text alignment="center" tone="subdued">
                      Advanced AI creates unique, engaging stories tailored to your child's age and interests
                    </Text>
                  </BlockStack>
                </div>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

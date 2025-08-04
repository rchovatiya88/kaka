import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "~/shopify.server";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  
  return json({
    shop: session.shop,
    apiKey: process.env.SHOPIFY_API_KEY,
  });
};

export default function StorybookCreator() {
  const { shop, apiKey } = useLoaderData();

  return (
    <Page
      title="AI Storybook Creator"
      subtitle="Create personalized children's storybooks with AI"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Text variant="headingMd" as="h2">
                Interactive Storybook Creator
              </Text>
              <Text variant="bodyMd" color="subdued">
                Your customers can create personalized storybooks that automatically become products in your store.
              </Text>
              
              {/* React App Container */}
              <div 
                id="shopify-storybook-app" 
                style={{ 
                  minHeight: '600px',
                  backgroundColor: '#f6f6f7',
                  borderRadius: '8px',
                  padding: '20px'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '200px',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div className="loading-spinner" style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #e1e1e1',
                    borderTop: '4px solid #008060',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <Text variant="bodyMd" color="subdued">
                    Loading AI Storybook Creator...
                  </Text>
                </div>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Load our React bundle */}
      <script 
        src="/storybook-app-bundle.js" 
        defer
        onLoad={() => {
          // Initialize the React app when the bundle loads
          if (window.StorybookApp) {
            window.StorybookApp.init({
              containerId: 'shopify-storybook-app',
              shopDomain: shop,
              apiKey: apiKey,
              mode: 'admin'
            });
          }
        }}
      />
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Page>
  );
}

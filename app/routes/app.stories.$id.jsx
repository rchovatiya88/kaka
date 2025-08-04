import { useState } from "react";
import { useLoaderData, useNavigation, useFetcher, useParams, useNavigate } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Thumbnail,
  SkeletonBodyText,
  SkeletonDisplayText,
  Banner,
  Modal,
  Divider,
  Icon,
  ButtonGroup,
  Tooltip,
} from "@shopify/polaris";
import {
  ArrowLeftIcon,
  EditIcon,
  DeleteIcon,
  ShareIcon,
  ArrowDownIcon,
  PrintIcon,
  PlayIcon,
  PauseCircleIcon,
  RefreshIcon,
} from "@shopify/polaris-icons";

export const loader = async ({ params }) => {
  await authenticate.admin();
  
  const storyId = params.id;
  
  // TODO: Fetch story from database
  // For now, return mock data
  return json({
    story: {
      id: storyId,
      title: "Maya's Magical Garden Adventure",
      childName: "Maya",
      theme: "Enchanted Forest",
      artStyle: "Watercolor",
      language: "English",
      pageCount: 5,
      status: "completed",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T11:45:00Z",
      isPublic: false,
      hasAudio: true,
      summary: "Maya discovers a magical garden where flowers need her help to bloom again after a mysterious spell.",
      characterDescription: "A curious 6-year-old girl with brown hair and a love for nature",
      specialRequests: "Include her pet rabbit, Luna",
      pages: [
        {
          pageNumber: 1,
          text: "Maya woke up excited for a new adventure. She had dreamed of a magical garden where flowers could talk and sing. Little did she know, her dream was about to come true!",
          imageUrl: "/story-images/maya-page-1.jpg",
          audioUrl: "/story-audio/maya-page-1.mp3",
          imagePrompt: "A young girl with brown hair waking up in a cozy bedroom, sunlight streaming through the window, with a sense of wonder and excitement"
        },
        {
          pageNumber: 2,
          text: "As Maya explored her backyard with her pet rabbit Luna, she noticed a shimmering path behind the old oak tree. The path was covered in golden sparkles that seemed to dance in the morning light.",
          imageUrl: "/story-images/maya-page-2.jpg",
          audioUrl: "/story-audio/maya-page-2.mp3",
          imagePrompt: "Maya and her white rabbit Luna discovering a magical sparkling path behind a large oak tree in a beautiful garden"
        },
        {
          pageNumber: 3,
          text: "Following the magical path, Maya found herself in the most beautiful garden she had ever seen. But something was wrong - all the flowers looked sad and droopy, their colors fading away.",
          imageUrl: "/story-images/maya-page-3.jpg",
          audioUrl: "/story-audio/maya-page-3.mp3",
          imagePrompt: "Maya entering a magical garden with wilted, sad-looking flowers in various stages of losing their color, watercolor style"
        },
        {
          pageNumber: 4,
          text: "A wise old sunflower spoke to Maya in a gentle voice: 'Dear child, our garden has lost its magic. Only someone with a pure heart and love for nature can help us bloom again.'",
          imageUrl: "/story-images/maya-page-4.jpg",
          audioUrl: "/story-audio/maya-page-4.mp3",
          imagePrompt: "Maya talking to a large, wise sunflower with a kind face, surrounded by other drooping flowers in a magical garden setting"
        },
        {
          pageNumber: 5,
          text: "Maya smiled and gently touched each flower, sharing her love and care. One by one, the flowers began to bloom brighter than ever before. The garden was alive with color and joy once again!",
          imageUrl: "/story-images/maya-page-5.jpg",
          audioUrl: "/story-audio/maya-page-5.mp3",
          imagePrompt: "Maya surrounded by vibrant, blooming flowers in full color, with Luna the rabbit nearby, showing a magical garden restored to its full beauty"
        }
      ],
      shareUrl: "https://stories.app/shared/maya-garden-adventure"
    }
  });
};

export const action = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get('_action');
  const storyId = params.id;

  switch (action) {
    case 'delete':
      // TODO: Delete story from database
      console.log('Deleting story:', storyId);
      return json({ success: true, message: 'Story deleted successfully', redirect: '/app/stories' });
      
    case 'togglePublic':
      // TODO: Toggle story public status
      console.log('Toggling public status for story:', storyId);
      return json({ success: true, message: 'Story visibility updated' });
      
    case 'regenerateImage':
      const pageNumber = formData.get('pageNumber');
      // TODO: Regenerate image for specific page
      console.log('Regenerating image for story:', storyId, 'page:', pageNumber);
      return json({ success: true, message: 'Image regeneration started' });
      
    default:
      return json({ error: 'Unknown action' }, { status: 400 });
  }
};

export default function StoryViewPage() {
  const { story } = useLoaderData();
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const isLoading = navigation.state === 'loading';
  const isDeleting = fetcher.state === 'submitting' && fetcher.formData?.get('_action') === 'delete';

  const currentPageData = story.pages[currentPage - 1];

  const handleDelete = () => {
    fetcher.submit({ _action: 'delete' }, { method: 'post' });
    setShowDeleteModal(false);
  };

  const handleRegenerateImage = (pageNumber) => {
    fetcher.submit(
      { _action: 'regenerateImage', pageNumber: pageNumber.toString() },
      { method: 'post' }
    );
  };

  const handleAudioToggle = () => {
    // TODO: Implement audio playback
    setIsPlaying(!isPlaying);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge tone="success">Completed</Badge>;
      case 'generating':
        return <Badge tone="info">Generating</Badge>;
      case 'failed':
        return <Badge tone="critical">Failed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  // Handle redirect after successful delete
  if (fetcher.data?.redirect) {
    navigate(fetcher.data.redirect);
  }

  if (isLoading) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <SkeletonDisplayText size="large" />
                <SkeletonBodyText lines={15} />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title={story.title}
      backAction={{
        content: 'Stories',
        url: '/app/stories',
      }}
      primaryAction={{
        content: 'Edit Story',
        icon: EditIcon,
        url: `/app/stories/${story.id}/edit`,
        disabled: story.status !== 'completed',
      }}
      secondaryActions={[
        {
          content: 'Share',
          icon: ShareIcon,
          onAction: () => setShowShareModal(true),
        },
        {
          content: 'Download PDF',
          icon: ArrowDownIcon,
          onAction: () => console.log('Download PDF'),
        },
        {
          content: 'Print',
          icon: PrintIcon,
          onAction: () => window.print(),
        },
        {
          content: 'Delete',
          icon: DeleteIcon,
          destructive: true,
          onAction: () => setShowDeleteModal(true),
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          {fetcher.data?.success && (
            <Banner tone="success" onDismiss={() => {}}>
              {fetcher.data.message}
            </Banner>
          )}
          
          {fetcher.data?.error && (
            <Banner tone="critical" onDismiss={() => {}}>
              {fetcher.data.error}
            </Banner>
          )}

          {/* Story Reader */}
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <BlockStack gap="200">
                  <InlineStack gap="300" align="center">
                    <Text variant="headingLg" as="h1">
                      📖 {story.title}
                    </Text>
                    {getStatusBadge(story.status)}
                  </InlineStack>
                  
                  <InlineStack gap="200" wrap>
                    <Badge>{story.language}</Badge>
                    <Badge tone="info">{story.artStyle}</Badge>
                    <Badge>{story.theme}</Badge>
                    <Badge>Page {currentPage} of {story.pageCount}</Badge>
                    {story.hasAudio && <Badge tone="attention">🔊 Audio Available</Badge>}
                    {story.isPublic && <Badge tone="success">🌍 Public</Badge>}
                  </InlineStack>
                </BlockStack>

                {/* Page Navigation */}
                <ButtonGroup>
                  <Button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    disabled={currentPage >= story.pageCount}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </ButtonGroup>
              </InlineStack>

              <Divider />

              {/* Current Page Content */}
              <InlineStack gap="600" align="start">
                {/* Story Image */}
                <div style={{ flexShrink: 0, width: '400px' }}>
                  <BlockStack gap="300">
                    <Card sectioned>
                      <img
                        src={currentPageData.imageUrl}
                        alt={`Page ${currentPage} illustration`}
                        style={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: '8px',
                          maxHeight: '400px',
                          objectFit: 'cover'
                        }}
                      />
                    </Card>
                    
                    <InlineStack gap="200" align="center">
                      <Tooltip content="Regenerate this image">
                        <Button
                          variant="tertiary"
                          icon={RefreshIcon}
                          onClick={() => handleRegenerateImage(currentPage)}
                          loading={fetcher.state === 'submitting' && fetcher.formData?.get('pageNumber') === currentPage.toString()}
                        >
                          Regenerate
                        </Button>
                      </Tooltip>
                      
                      {story.hasAudio && (
                        <Button
                          variant="tertiary"
                          icon={isPlaying ? PauseCircleIcon : PlayIcon}
                          onClick={handleAudioToggle}
                        >
                          {isPlaying ? 'Pause' : 'Play'} Audio
                        </Button>
                      )}
                    </InlineStack>
                  </BlockStack>
                </div>

                {/* Story Text */}
                <BlockStack gap="400" style={{ flex: 1 }}>
                  <Card sectioned>
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h3">
                        Page {currentPage}
                      </Text>
                      
                      <Text variant="bodyLg" as="p" style={{ lineHeight: '1.6' }}>
                        {currentPageData.text}
                      </Text>
                    </BlockStack>
                  </Card>

                  {/* Page Thumbnails */}
                  <Card sectioned>
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h4">
                        All Pages
                      </Text>
                      
                      <InlineStack gap="200" wrap>
                        {story.pages.map((page, index) => (
                          <Button
                            key={page.pageNumber}
                            variant={currentPage === page.pageNumber ? "primary" : "tertiary"}
                            onClick={() => setCurrentPage(page.pageNumber)}
                            size="micro"
                          >
                            <BlockStack gap="100" align="center">
                              <Thumbnail
                                source={page.imageUrl}
                                alt={`Page ${page.pageNumber}`}
                                size="small"
                              />
                              <Text variant="bodySm">
                                Page {page.pageNumber}
                              </Text>
                            </BlockStack>
                          </Button>
                        ))}
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            {/* Story Details */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  📋 Story Details
                </Text>
                
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" tone="subdued">Character:</Text>
                    <Text variant="bodyMd" fontWeight="medium">{story.childName}</Text>
                  </InlineStack>
                  
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" tone="subdued">Theme:</Text>
                    <Text variant="bodyMd">{story.theme}</Text>
                  </InlineStack>
                  
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" tone="subdued">Art Style:</Text>
                    <Text variant="bodyMd">{story.artStyle}</Text>
                  </InlineStack>
                  
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" tone="subdued">Language:</Text>
                    <Text variant="bodyMd">{story.language}</Text>
                  </InlineStack>
                  
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" tone="subdued">Pages:</Text>
                    <Text variant="bodyMd">{story.pageCount}</Text>
                  </InlineStack>
                  
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" tone="subdued">Status:</Text>
                    {getStatusBadge(story.status)}
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Story Summary */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  ✨ Story Summary
                </Text>
                
                <Text variant="bodyMd">
                  {story.summary}
                </Text>
                
                <Divider />
                
                <BlockStack gap="200">
                  <Text variant="bodyMd" fontWeight="medium">Character Description:</Text>
                  <Text variant="bodyMd" tone="subdued">
                    {story.characterDescription}
                  </Text>
                  
                  {story.specialRequests && (
                    <>
                      <Text variant="bodyMd" fontWeight="medium">Special Requests:</Text>
                      <Text variant="bodyMd" tone="subdued">
                        {story.specialRequests}
                      </Text>
                    </>
                  )}
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Timestamps */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  🕒 Timeline
                </Text>
                
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" tone="subdued">Created:</Text>
                    <Text variant="bodyMd">{formatDate(story.createdAt)}</Text>
                  </InlineStack>
                  
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" tone="subdued">Updated:</Text>
                    <Text variant="bodyMd">{formatDate(story.updatedAt)}</Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Story"
        primaryAction={{
          content: 'Delete Story',
          onAction: handleDelete,
          destructive: true,
          loading: isDeleting,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowDeleteModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text variant="bodyMd">
              Are you sure you want to delete "{story.title}"? This action cannot be undone.
            </Text>
            
            <Text variant="bodyMd" tone="subdued">
              This will permanently remove the story, including all images and audio files.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Share Modal */}
      <Modal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Story"
        primaryAction={{
          content: 'Copy Link',
          onAction: () => {
            navigator.clipboard.writeText(story.shareUrl);
            // TODO: Show success toast
          },
        }}
        secondaryActions={[
          {
            content: 'Close',
            onAction: () => setShowShareModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text variant="bodyMd">
              Share this story with others using the link below:
            </Text>
            
            <Card sectioned>
              <Text variant="bodyMd" fontWeight="medium">
                {story.shareUrl}
              </Text>
            </Card>
            
            <Text variant="bodyMd" tone="subdued">
              {story.isPublic 
                ? "This story is public and can be viewed by anyone with the link."
                : "This story is private. Only you can view it."
              }
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
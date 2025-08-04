import { useState } from "react";
import { useLoaderData, useNavigation, useFetcher, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Thumbnail,
  SkeletonBodyText,
  SkeletonDisplayText,
  EmptyState,
  Filters,
  TextField,
  Select,
  Pagination,
  Modal,
  Banner,
  Icon,
} from "@shopify/polaris";
import {
  PlusIcon,
  ViewIcon,
  EditIcon,
  DeleteIcon,
  ExportIcon,
  BookIcon,
} from "@shopify/polaris-icons";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  // TODO: Fetch stories from database
  // For now, return mock data
  return json({
    stories: [
      {
        id: "1",
        title: "Maya's Magical Garden Adventure",
        childName: "Maya",
        theme: "Enchanted Forest",
        artStyle: "Watercolor",
        language: "English",
        pageCount: 5,
        status: "completed",
        createdAt: "2024-01-15T10:30:00Z",
        thumbnail: "/story-thumbnails/maya-garden.jpg",
        isPublic: false,
        hasAudio: true,
      },
      {
        id: "2", 
        title: "Alex's Space Journey",
        childName: "Alex",
        theme: "Space Adventure",
        artStyle: "Digital Art",
        language: "Spanish",
        pageCount: 8,
        status: "generating",
        createdAt: "2024-01-14T15:20:00Z",
        thumbnail: "/story-thumbnails/alex-space.jpg",
        isPublic: true,
        hasAudio: false,
      },
      {
        id: "3",
        title: "Zara's Underwater Kingdom",
        childName: "Zara",
        theme: "Underwater Explorer", 
        artStyle: "Storybook",
        language: "Hindi",
        pageCount: 6,
        status: "completed",
        createdAt: "2024-01-13T09:15:00Z",
        thumbnail: "/story-thumbnails/zara-underwater.jpg",
        isPublic: false,
        hasAudio: true,
      }
    ],
    totalCount: 3,
    hasNextPage: false,
    hasPreviousPage: false,
  });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get('_action');
  const storyId = formData.get('storyId');

  switch (action) {
    case 'delete':
      // TODO: Delete story from database
      console.log('Deleting story:', storyId);
      return json({ success: true, message: 'Story deleted successfully' });
      
    case 'togglePublic':
      // TODO: Toggle story public status
      console.log('Toggling public status for story:', storyId);
      return json({ success: true, message: 'Story visibility updated' });
      
    default:
      return json({ error: 'Unknown action' }, { status: 400 });
  }
};

export default function StoriesPage() {
  const { stories, totalCount, hasNextPage, hasPreviousPage } = useLoaderData();
  const navigation = useNavigation();
  const fetcher = useFetcher();
  
  const [selectedStories, setSelectedStories] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);
  const [queryValue, setQueryValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');

  const isLoading = navigation.state === 'loading';
  const isDeleting = fetcher.state === 'submitting' && fetcher.formData?.get('_action') === 'delete';

  const handleDeleteStory = (story) => {
    setStoryToDelete(story);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (storyToDelete) {
      fetcher.submit(
        { _action: 'delete', storyId: storyToDelete.id },
        { method: 'post' }
      );
      setShowDeleteModal(false);
      setStoryToDelete(null);
    }
  };

  const togglePublicStatus = (storyId) => {
    fetcher.submit(
      { _action: 'togglePublic', storyId },
      { method: 'post' }
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  const filteredStories = stories.filter(story => {
    const matchesQuery = story.title.toLowerCase().includes(queryValue.toLowerCase()) ||
                        story.childName.toLowerCase().includes(queryValue.toLowerCase());
    const matchesStatus = statusFilter === 'all' || story.status === statusFilter;
    const matchesLanguage = languageFilter === 'all' || story.language.toLowerCase() === languageFilter.toLowerCase();
    
    return matchesQuery && matchesStatus && matchesLanguage;
  });

  const rows = filteredStories.map((story) => [
    <InlineStack gap="300" align="center">
      <Thumbnail
        source={story.thumbnail}
        alt={story.title}
        size="small"
      />
      <BlockStack gap="100">
        <Text variant="bodyMd" fontWeight="semibold">
          {story.title}
        </Text>
        <Text variant="bodySm" tone="subdued">
          Character: {story.childName}
        </Text>
      </BlockStack>
    </InlineStack>,
    
    <BlockStack gap="100">
      <Text variant="bodySm">{story.theme}</Text>
      <Text variant="bodySm" tone="subdued">{story.artStyle}</Text>
    </BlockStack>,

    <InlineStack gap="200">
      <Badge>{story.language}</Badge>
      <Badge tone="info">{story.pageCount} pages</Badge>
      {story.hasAudio && <Badge tone="attention">Audio</Badge>}
      {story.isPublic && <Badge tone="success">Public</Badge>}
    </InlineStack>,

    getStatusBadge(story.status),

    <Text variant="bodySm">{formatDate(story.createdAt)}</Text>,

    <InlineStack gap="100">
      <Button
        variant="tertiary"
        size="micro"
        icon={ViewIcon}
        url={`/app/stories/${story.id}`}
        accessibilityLabel={`View ${story.title}`}
      >
        View
      </Button>
      
      {story.status === 'completed' && (
        <Button
          variant="tertiary"
          size="micro"
          icon={EditIcon}
          url={`/app/stories/${story.id}/edit`}
          accessibilityLabel={`Edit ${story.title}`}
        >
          Edit
        </Button>
      )}
      
      <Button
        variant="tertiary"
        size="micro"
        icon={DeleteIcon}
        onClick={() => handleDeleteStory(story)}
        tone="critical"
        accessibilityLabel={`Delete ${story.title}`}
      >
        Delete
      </Button>
    </InlineStack>
  ]);

  const filters = [
    {
      key: 'status',
      label: 'Status',
      filter: (
        <Select
          label="Status"
          labelHidden
          options={[
            { label: 'All statuses', value: 'all' },
            { label: 'Completed', value: 'completed' },
            { label: 'Generating', value: 'generating' },
            { label: 'Failed', value: 'failed' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      ),
    },
    {
      key: 'language',
      label: 'Language',
      filter: (
        <Select
          label="Language"
          labelHidden
          options={[
            { label: 'All languages', value: 'all' },
            { label: 'English', value: 'english' },
            { label: 'Spanish', value: 'spanish' },
            { label: 'Hindi', value: 'hindi' },
          ]}
          value={languageFilter}
          onChange={setLanguageFilter}
        />
      ),
    },
  ];

  if (isLoading) {
    return (
      <Page title="Stories">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <SkeletonDisplayText size="medium" />
                <SkeletonBodyText lines={10} />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="My Stories"
      primaryAction={{
        content: 'Create Story',
        icon: PlusIcon,
        url: '/app/create',
      }}
      secondaryActions={[
        {
          content: 'Export All',
          icon: ExportIcon,
          onAction: () => console.log('Export all stories'),
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

          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <BlockStack gap="100">
                  <Text variant="headingLg" as="h2">
                    📚 Story Library
                  </Text>
                  <Text variant="bodyMd" tone="subdued">
                    Manage your AI-generated children's stories
                  </Text>
                </BlockStack>
                
                <Text variant="bodyMd" tone="subdued">
                  {totalCount} {totalCount === 1 ? 'story' : 'stories'}
                </Text>
              </InlineStack>

              {stories.length === 0 ? (
                <EmptyState
                  heading="No stories yet"
                  action={{
                    content: 'Create your first story',
                    url: '/app/create',
                  }}
                  image="/empty-states/stories.svg"
                >
                  <Text variant="bodyMd" tone="subdued">
                    Start creating magical, personalized stories for children with AI-powered illustrations and narration.
                  </Text>
                </EmptyState>
              ) : (
                <BlockStack gap="400">
                  <Filters
                    queryValue={queryValue}
                    filters={filters}
                    onQueryChange={setQueryValue}
                    onQueryClear={() => setQueryValue('')}
                    onClearAll={() => {
                      setQueryValue('');
                      setStatusFilter('all');
                      setLanguageFilter('all');
                    }}
                  >
                    <TextField
                      label="Search stories"
                      labelHidden
                      value={queryValue}
                      onChange={setQueryValue}
                      placeholder="Search by title or character name..."
                      clearButton
                      onClearButtonClick={() => setQueryValue('')}
                    />
                  </Filters>

                  <DataTable
                    columnContentTypes={[
                      'text',
                      'text', 
                      'text',
                      'text',
                      'text',
                      'text',
                    ]}
                    headings={[
                      'Story',
                      'Theme & Style',
                      'Details',
                      'Status',
                      'Created',
                      'Actions',
                    ]}
                    rows={rows}
                    increasedTableDensity
                    hasZebraStripingOnData
                  />

                  {(hasNextPage || hasPreviousPage) && (
                    <InlineStack align="center">
                      <Pagination
                        hasNext={hasNextPage}
                        hasPrevious={hasPreviousPage}
                        onNext={() => {
                          // TODO: Handle pagination
                        }}
                        onPrevious={() => {
                          // TODO: Handle pagination
                        }}
                      />
                    </InlineStack>
                  )}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            {/* Quick Stats Card */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  📊 Quick Stats
                </Text>
                
                <InlineStack gap="400" wrap>
                  <BlockStack gap="100">
                    <Text variant="headingLg" as="p">
                      {stories.filter(s => s.status === 'completed').length}
                    </Text>
                    <Text variant="bodySm" tone="subdued">
                      Completed Stories
                    </Text>
                  </BlockStack>
                  
                  <BlockStack gap="100">
                    <Text variant="headingLg" as="p">
                      {stories.filter(s => s.hasAudio).length}
                    </Text>
                    <Text variant="bodySm" tone="subdued">
                      With Audio
                    </Text>
                  </BlockStack>
                  
                  <BlockStack gap="100">
                    <Text variant="headingLg" as="p">
                      {stories.filter(s => s.isPublic).length}
                    </Text>
                    <Text variant="bodySm" tone="subdued">
                      Public Stories
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>

            {/* Recent Activity */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  ⚡ Recent Activity
                </Text>
                
                <BlockStack gap="200">
                  {stories.slice(0, 3).map((story) => (
                    <InlineStack key={story.id} align="space-between">
                      <BlockStack gap="050">
                        <Text variant="bodyMd" fontWeight="medium">
                          {story.title}
                        </Text>
                        <Text variant="bodySm" tone="subdued">
                          {formatDate(story.createdAt)}
                        </Text>
                      </BlockStack>
                      
                      {getStatusBadge(story.status)}
                    </InlineStack>
                  ))}
                </BlockStack>
                
                <Button
                  variant="tertiary"
                  fullWidth
                  url="/app/activity"
                >
                  View All Activity
                </Button>
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
          onAction: confirmDelete,
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
              Are you sure you want to delete "{storyToDelete?.title}"? This action cannot be undone.
            </Text>
            
            <Text variant="bodyMd" tone="subdued">
              This will permanently remove the story, including all images and audio files.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
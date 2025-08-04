import { useState, useEffect, useCallback } from "react";
import {
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  BlockStack,
  Text,
  Divider,
  InlineStack,
  Badge,
  Banner,
  Spinner,
  DropZone,
  Thumbnail,
  Checkbox,
  ProgressBar,
  Icon,
  Collapsible,
} from "@shopify/polaris";
import {
  DeleteIcon,
  ImageIcon,
} from "@shopify/polaris-icons";
import { STORY_THEMES, ART_STYLES, LANGUAGES, AGE_GROUPS, STORY_LENGTHS } from '../lib/utils/constants';
import { useStoryProgress } from '../lib/hooks/useStoryProgress';

// Converted themes to Polaris Select format
const THEME_OPTIONS = STORY_THEMES.map(theme => ({
  label: theme.title,
  value: theme.id
}));

const ART_STYLE_OPTIONS = ART_STYLES.map(style => ({
  label: style.name,
  value: style.id
}));

const LANGUAGE_OPTIONS = LANGUAGES.map(lang => ({
  label: `${lang.flag} ${lang.name}`,
  value: lang.code
}));

const AGE_GROUP_OPTIONS = AGE_GROUPS.map(group => ({
  label: group.label,
  value: group.id
}));

const STORY_LENGTH_OPTIONS = STORY_LENGTHS.map(length => ({
  label: length.label,
  value: length.pages.toString()
}));

export default function StoryCreatorForm({ theme, fetcher }) {
  const [formData, setFormData] = useState({
    childName: "",
    childAge: "",
    storyLength: "5",
    storyTheme: theme || "fantasy-adventure",
    characterDescription: "",
    specialRequests: "",
    includeAudio: true,
    language: "en",
    artStyle: "storybook",
  });

  const [characterImage, setCharacterImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [characterDetails, setCharacterDetails] = useState({
    age: 'child (4-6)',
    gender: 'child',
    hairColor: 'brown',
    hairStyle: 'short',
    eyeColor: 'brown',
    skinTone: 'medium',
    clothingStyle: 'casual',
    specialFeatures: '',
    personalityTraits: ['cheerful']
  });
  const [errors, setErrors] = useState({});
  
  const { progress, currentStep, isGenerating, startProgress, updateProgress, completeProgress } = useStoryProgress();

  const isLoading = fetcher.state === "submitting";

  const handleInputChange = (field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = useCallback((files) => {
    const file = files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, characterImage: 'Please select a valid image file' }));
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, characterImage: 'Image size must be less than 10MB' }));
        return;
      }

      setCharacterImage(file);
      setErrors(prev => ({ ...prev, characterImage: '' }));
      
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      
      console.log('📸 Character image uploaded:', file.name, file.size);
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setCharacterImage(null);
    setImagePreview(null);
    setErrors(prev => ({ ...prev, characterImage: '' }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.childName.trim()) {
      newErrors.childName = 'Character name is required';
    } else if (formData.childName.trim().length < 2) {
      newErrors.childName = 'Character name must be at least 2 characters';
    } else if (formData.childName.trim().length > 50) {
      newErrors.childName = 'Character name must be less than 50 characters';
    }

    if (!formData.childAge) {
      newErrors.childAge = 'Age group is required';
    }

    if (!formData.characterDescription.trim()) {
      newErrors.characterDescription = 'Story guidance is required';
    } else if (formData.characterDescription.trim().length < 10) {
      newErrors.characterDescription = 'Story guidance must be at least 10 characters';
    } else if (formData.characterDescription.trim().length > 500) {
      newErrors.characterDescription = 'Story guidance must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    startProgress();
    
    const submitData = new FormData();
    
    // Add form data
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]);
    });
    
    // Add character details if image uploaded
    if (characterImage) {
      submitData.append('characterImage', characterImage);
      submitData.append('characterDetails', JSON.stringify(characterDetails));
    }

    fetcher.submit(submitData, {
      method: "post",
      encType: "multipart/form-data",
    });
  };

  // Auto-save form data to localStorage
  useEffect(() => {
    if (formData.childName || formData.characterDescription) {
      localStorage.setItem('story_form_draft', JSON.stringify(formData));
    }
  }, [formData]);

  // Restore form data on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('story_form_draft');
    if (savedDraft) {
      try {
        const data = JSON.parse(savedDraft);
        setFormData(prev => ({ ...prev, ...data }));
      } catch (error) {
        console.warn('Failed to restore form draft:', error);
      }
    }
  }, []);

  const selectedTheme = STORY_THEMES.find(t => t.id === formData.storyTheme);
  const selectedLanguage = LANGUAGES.find(l => l.code === formData.language);

  return (
    <BlockStack gap="500">
      {fetcher.data?.error && (
        <Banner tone="critical" title="Error generating story">
          <p>{fetcher.data.error}</p>
        </Banner>
      )}

      {/* Progress Bar */}
      {isGenerating && (
        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h3">Creating Your Story...</Text>
            <ProgressBar progress={progress} size="small" />
            <Text variant="bodyMd" tone="subdued">{currentStep}</Text>
          </BlockStack>
        </Card>
      )}

      {/* Language Selection */}
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2">🌍 Story Language</Text>
          <Text variant="bodyMd" tone="subdued">
            Choose the language for your child's personalized story
          </Text>
          
          <Select
            label="Language"
            options={LANGUAGE_OPTIONS}
            value={formData.language}
            onChange={handleInputChange('language')}
            helpText="Stories will be generated in your selected language"
          />
        </BlockStack>
      </Card>

      {/* Story Details */}
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2">✨ Story Details</Text>
          
          <FormLayout>
            <FormLayout.Group>
              <TextField
                label="Child's Name"
                value={formData.childName}
                onChange={handleInputChange('childName')}
                placeholder="Enter the main character's name"
                helpText="This will be the hero of the story"
                autoComplete="off"
                error={errors.childName}
                requiredIndicator
              />
              
              <Select
                label="Age Group"
                options={AGE_GROUP_OPTIONS}
                value={formData.childAge}
                onChange={handleInputChange('childAge')}
                placeholder="Select age group"
                error={errors.childAge}
              />
            </FormLayout.Group>

            <FormLayout.Group>
              <Select
                label="Story Theme"
                options={THEME_OPTIONS}
                value={formData.storyTheme}
                onChange={handleInputChange('storyTheme')}
              />
              
              <Select
                label="Art Style"
                options={ART_STYLE_OPTIONS}
                value={formData.artStyle}
                onChange={handleInputChange('artStyle')}
                helpText="Choose the visual style for illustrations"
              />
            </FormLayout.Group>

            <FormLayout.Group>
              <Select
                label="Story Length"
                options={STORY_LENGTH_OPTIONS}
                value={formData.storyLength}
                onChange={handleInputChange('storyLength')}
              />
            </FormLayout.Group>

            <TextField
              label="Adventure Summary"
              value={formData.characterDescription}
              onChange={handleInputChange('characterDescription')}
              multiline={3}
              placeholder="Describe the adventure your character will experience..."
              helpText="Help us create an engaging story for your child"
              error={errors.characterDescription}
              showCharacterCount
              maxLength={500}
              requiredIndicator
            />
          </FormLayout>
        </BlockStack>
      </Card>

      {/* Character Image Upload */}
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2">📸 Character Photo (Optional)</Text>
          <Text variant="bodyMd" tone="subdued">
            Upload a photo to create a personalized character that looks like your child. This makes the story even more magical!
          </Text>

          {!imagePreview ? (
            <DropZone
              onDrop={handleImageUpload}
              accept="image/*"
              type="image"
              errorOverlayText="File type must be .jpg, .png, or .gif"
            >
              <DropZone.FileUpload actionTitle="Add image" actionHint="or drop image to upload" />
            </DropZone>
          ) : (
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Thumbnail
                  source={imagePreview}
                  alt="Character preview"
                  size="large"
                />
                <Button
                  icon={DeleteIcon}
                  onClick={handleRemoveImage}
                  variant="tertiary"
                  tone="critical"
                >
                  Remove Image
                </Button>
              </InlineStack>
              <Text variant="bodyMd" tone="success">
                Character photo uploaded! Your child will be the hero of this story.
              </Text>
            </BlockStack>
          )}
          
          {errors.characterImage && (
            <Text variant="bodyMd" tone="critical">
              {errors.characterImage}
            </Text>
          )}
        </BlockStack>
      </Card>

      {/* Character Details (shown when image is uploaded) */}
      {characterImage && (
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text variant="headingMd" as="h2">👤 Character Details</Text>
              <Button
                variant="tertiary"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                {showAdvancedOptions ? 'Hide Details' : 'Show Details'}
              </Button>
            </InlineStack>
            
            <Text variant="bodyMd" tone="subdued">
              Help us create the perfect character from your photo! The more details you provide, the better we can preserve your character's unique features.
            </Text>

            <FormLayout>
              <FormLayout.Group>
                <Select
                  label="Age Group"
                  options={[
                    { label: 'Toddler (2-3)', value: 'toddler (2-3)' },
                    { label: 'Preschooler (3-5)', value: 'preschooler (3-5)' },
                    { label: 'Child (4-6)', value: 'child (4-6)' },
                    { label: 'Early Elementary (6-8)', value: 'early elementary (6-8)' },
                  ]}
                  value={characterDetails.age}
                  onChange={(value) => setCharacterDetails(prev => ({ ...prev, age: value }))}
                />
                
                <Select
                  label="Gender"
                  options={[
                    { label: 'Boy', value: 'boy' },
                    { label: 'Girl', value: 'girl' },
                    { label: 'Child (neutral)', value: 'child' },
                  ]}
                  value={characterDetails.gender}
                  onChange={(value) => setCharacterDetails(prev => ({ ...prev, gender: value }))}
                />
              </FormLayout.Group>
            </FormLayout>

            <Collapsible open={showAdvancedOptions}>
              <BlockStack gap="300">
                <Divider />
                <FormLayout>
                  <FormLayout.Group>
                    <Select
                      label="Hair Color"
                      options={[
                        { label: 'Brown', value: 'brown' },
                        { label: 'Black', value: 'black' },
                        { label: 'Blonde', value: 'blonde' },
                        { label: 'Red/Auburn', value: 'red' },
                        { label: 'Light Brown', value: 'light brown' },
                        { label: 'Dark Brown', value: 'dark brown' },
                      ]}
                      value={characterDetails.hairColor}
                      onChange={(value) => setCharacterDetails(prev => ({ ...prev, hairColor: value }))}
                    />
                    
                    <Select
                      label="Hair Style"
                      options={[
                        { label: 'Short', value: 'short' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'Long', value: 'long' },
                        { label: 'Curly', value: 'curly' },
                        { label: 'Wavy', value: 'wavy' },
                        { label: 'Straight', value: 'straight' },
                      ]}
                      value={characterDetails.hairStyle}
                      onChange={(value) => setCharacterDetails(prev => ({ ...prev, hairStyle: value }))}
                    />
                  </FormLayout.Group>

                  <FormLayout.Group>
                    <Select
                      label="Eye Color"
                      options={[
                        { label: 'Brown', value: 'brown' },
                        { label: 'Blue', value: 'blue' },
                        { label: 'Green', value: 'green' },
                        { label: 'Hazel', value: 'hazel' },
                        { label: 'Gray', value: 'gray' },
                        { label: 'Amber', value: 'amber' },
                      ]}
                      value={characterDetails.eyeColor}
                      onChange={(value) => setCharacterDetails(prev => ({ ...prev, eyeColor: value }))}
                    />
                    
                    <Select
                      label="Skin Tone"
                      options={[
                        { label: 'Fair', value: 'fair' },
                        { label: 'Light', value: 'light' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'Olive', value: 'olive' },
                        { label: 'Tan', value: 'tan' },
                        { label: 'Dark', value: 'dark' },
                      ]}
                      value={characterDetails.skinTone}
                      onChange={(value) => setCharacterDetails(prev => ({ ...prev, skinTone: value }))}
                    />
                  </FormLayout.Group>

                  <TextField
                    label="Special Features (Optional)"
                    value={characterDetails.specialFeatures}
                    onChange={(value) => setCharacterDetails(prev => ({ ...prev, specialFeatures: value }))}
                    placeholder="e.g., glasses, freckles, dimples, braces..."
                  />
                </FormLayout>
              </BlockStack>
            </Collapsible>
          </BlockStack>
        </Card>
      )}

      {/* Additional Options */}
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2">🎯 Additional Options</Text>
          
          <FormLayout>
            <TextField
              label="Special Requests"
              value={formData.specialRequests}
              onChange={handleInputChange('specialRequests')}
              multiline={2}
              placeholder="Any special elements you'd like in the story? (pets, favorite activities, etc.)"
              helpText="Optional: Add personal touches to make the story more meaningful"
            />

            <Checkbox
              label="Include AI-generated audio narration"
              checked={formData.includeAudio}
              onChange={handleInputChange('includeAudio')}
              helpText="Add voice narration to bring your story to life"
            />
          </FormLayout>
        </BlockStack>
      </Card>

      {/* Story Summary */}
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2">📚 Story Preview</Text>
          
          <InlineStack gap="200" wrap>
            <Badge tone="info">Theme: {selectedTheme?.title}</Badge>
            <Badge tone="success">Length: {STORY_LENGTHS.find(l => l.pages.toString() === formData.storyLength)?.label}</Badge>
            {formData.childAge && <Badge>Age: {AGE_GROUPS.find(a => a.id === formData.childAge)?.label}</Badge>}
            <Badge tone="magic">Language: {selectedLanguage?.flag} {selectedLanguage?.name}</Badge>
            <Badge>Art: {ART_STYLES.find(s => s.id === formData.artStyle)?.name}</Badge>
            {formData.includeAudio && <Badge tone="attention">Audio Included</Badge>}
            {characterImage && <Badge tone="success">✨ Personalized Character</Badge>}
          </InlineStack>

          <Divider />

          <BlockStack gap="200">
            <Text variant="bodyMd" as="p">
              <strong>🌟 Story Preview:</strong> {formData.childName || "Your child"} will embark on an exciting {selectedTheme?.title.toLowerCase()} adventure! 
              {formData.characterDescription && ` ${formData.characterDescription}`}
              {formData.specialRequests && ` The story will include ${formData.specialRequests.toLowerCase()}.`}
            </Text>
            
            <Text variant="bodyMd" tone="subdued">
              🎨 The AI will generate a personalized {STORY_LENGTHS.find(l => l.pages.toString() === formData.storyLength)?.label.toLowerCase()} story 
              with beautiful {ART_STYLES.find(s => s.id === formData.artStyle)?.name.toLowerCase()} illustrations
              {characterImage ? ' featuring your uploaded character' : ''}
              {formData.includeAudio ? ' and audio narration' : ''}.
            </Text>
            
            {characterImage && (
              <Text variant="bodyMd" tone="success">
                ✨ <strong>Personalized:</strong> Your uploaded character photo will be transformed into a consistent storybook character throughout all scenes!
              </Text>
            )}
          </BlockStack>
        </BlockStack>
      </Card>

      {/* Tips for Better Stories */}
      <Card>
        <BlockStack gap="300">
          <Text variant="headingMd" as="h3">💡 Tips for Amazing Stories</Text>
          <BlockStack gap="200">
            <Text variant="bodyMd">• Upload a clear, well-lit photo for best character results</Text>
            <Text variant="bodyMd">• Be specific in your adventure summary for more engaging content</Text>
            <Text variant="bodyMd">• Simple names work best for young readers</Text>
            <Text variant="bodyMd">• Different art styles create unique visual experiences</Text>
            {selectedLanguage?.code !== 'en' && (
              <Text variant="bodyMd" tone="info">
                🌍 Write in {selectedLanguage?.name} for the best multilingual experience
              </Text>
            )}
          </BlockStack>
        </BlockStack>
      </Card>

      {/* Submit Button */}
      <Card>
        <BlockStack gap="300">
          <Button
            variant="primary"
            size="large"
            onClick={handleSubmit}
            disabled={!formData.childName || !formData.childAge || !formData.characterDescription || isGenerating}
            loading={isGenerating}
            fullWidth
          >
            {isGenerating ? (
              <InlineStack gap="100" align="center">
                <Spinner size="small" />
                <span>Creating Your Magical Story...</span>
              </InlineStack>
            ) : (
              <InlineStack gap="100" align="center">
                <Icon source={ImageIcon} />
                <span>✨ Create My Story!</span>
              </InlineStack>
            )}
          </Button>
          
          {!formData.childName || !formData.childAge || !formData.characterDescription ? (
            <Text variant="bodyMd" tone="subdued" alignment="center">
              Please fill in the required fields to create your story
            </Text>
          ) : (
            <Text variant="bodyMd" tone="success" alignment="center">
              Ready to create your personalized adventure!
            </Text>
          )}
        </BlockStack>
      </Card>
    </BlockStack>
  );
}

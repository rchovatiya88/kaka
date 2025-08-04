// Shopify Admin API integration utilities

/**
 * Product creation for story-based products
 */
export async function createStoryProduct(admin, storyData) {
  const mutation = `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
          handle
          status
          images(first: 1) {
            nodes {
              id
              url
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      title: `${storyData.childName}'s ${storyData.theme} Story`,
      descriptionHtml: `
        <p>A personalized ${storyData.theme.toLowerCase()} adventure story featuring ${storyData.childName}!</p>
        <ul>
          <li>Age group: ${storyData.ageGroup} years</li>
          <li>Story length: ${storyData.length}</li>
          ${storyData.includeAudio ? '<li>Includes audio narration</li>' : ''}
        </ul>
      `,
      vendor: "Story Creator App",
      productType: "Digital Story",
      tags: [
        "personalized",
        "story",
        storyData.theme,
        `age-${storyData.ageGroup}`,
        storyData.length,
        ...(storyData.includeAudio ? ["audio"] : [])
      ],
      status: "DRAFT",
      variants: [{
        price: "9.99", // Base price, can be configured
        inventoryPolicy: "CONTINUE",
        inventoryManagement: "SHOPIFY",
        inventoryQuantities: [{
          availableQuantity: 999,
          locationId: "gid://shopify/Location/1" // Will need to get actual location
        }]
      }]
    }
  };

  try {
    const response = await admin.graphql(mutation, { variables });
    const result = await response.json();
    
    if (result.data?.productCreate?.userErrors?.length > 0) {
      throw new Error(`Product creation failed: ${result.data.productCreate.userErrors.map(e => e.message).join(', ')}`);
    }
    
    return result.data?.productCreate?.product;
    
  } catch (error) {
    console.error("Failed to create story product:", error);
    throw error;
  }
}

/**
 * Get shop information
 */
export async function getShopInfo(admin) {
  const query = `
    query {
      shop {
        id
        name
        email
        domain
        myshopifyDomain
        plan {
          displayName
        }
        currencyCode
        timezoneOffsetMinutes
      }
    }
  `;

  try {
    const response = await admin.graphql(query);
    const result = await response.json();
    return result.data?.shop;
  } catch (error) {
    console.error("Failed to get shop info:", error);
    throw error;
  }
}

/**
 * Get primary location for inventory management
 */
export async function getPrimaryLocation(admin) {
  const query = `
    query {
      locations(first: 1, query: "active:true") {
        nodes {
          id
          name
          address {
            address1
            city
            country
          }
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(query);
    const result = await response.json();
    return result.data?.locations?.nodes?.[0];
  } catch (error) {
    console.error("Failed to get primary location:", error);
    throw error;
  }
}

/**
 * Create customer for story sharing
 */
export async function createCustomer(admin, customerData) {
  const mutation = `
    mutation customerCreate($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          firstName
          lastName
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      email: customerData.email,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      tags: ["story-customer"]
    }
  };

  try {
    const response = await admin.graphql(mutation, { variables });
    const result = await response.json();
    
    if (result.data?.customerCreate?.userErrors?.length > 0) {
      throw new Error(`Customer creation failed: ${result.data.customerCreate.userErrors.map(e => e.message).join(', ')}`);
    }
    
    return result.data?.customerCreate?.customer;
    
  } catch (error) {
    console.error("Failed to create customer:", error);
    throw error;
  }
}

/**
 * Create order for story purchase
 */
export async function createDraftOrder(admin, orderData) {
  const mutation = `
    mutation draftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          name
          totalPrice
          customer {
            id
            email
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(mutation, { variables: { input: orderData } });
    const result = await response.json();
    
    if (result.data?.draftOrderCreate?.userErrors?.length > 0) {
      throw new Error(`Draft order creation failed: ${result.data.draftOrderCreate.userErrors.map(e => e.message).join(', ')}`);
    }
    
    return result.data?.draftOrderCreate?.draftOrder;
    
  } catch (error) {
    console.error("Failed to create draft order:", error);
    throw error;
  }
}

/**
 * Upload file to Shopify (for story assets)
 */
export async function uploadFile(admin, fileData) {
  // First stage the upload
  const stagedUploadMutation = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const stagedVariables = {
    input: [{
      filename: fileData.filename,
      mimeType: fileData.mimeType,
      httpMethod: "POST",
      resource: "FILE"
    }]
  };

  try {
    const stagedResponse = await admin.graphql(stagedUploadMutation, { variables: stagedVariables });
    const stagedResult = await stagedResponse.json();
    
    if (stagedResult.data?.stagedUploadsCreate?.userErrors?.length > 0) {
      throw new Error(`Staged upload failed: ${stagedResult.data.stagedUploadsCreate.userErrors.map(e => e.message).join(', ')}`);
    }
    
    const stagedTarget = stagedResult.data?.stagedUploadsCreate?.stagedTargets?.[0];
    
    if (!stagedTarget) {
      throw new Error("No staged upload target returned");
    }
    
    // TODO: Upload file to staged URL
    // This would typically involve uploading the file to the provided URL
    
    // Then create the file record
    const fileCreateMutation = `
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            alt
            createdAt
            fileStatus
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const fileVariables = {
      files: [{
        alt: fileData.alt || fileData.filename,
        contentType: "FILE",
        originalSource: stagedTarget.resourceUrl
      }]
    };

    const fileResponse = await admin.graphql(fileCreateMutation, { variables: fileVariables });
    const fileResult = await fileResponse.json();
    
    return fileResult.data?.fileCreate?.files?.[0];
    
  } catch (error) {
    console.error("Failed to upload file:", error);
    throw error;
  }
}

/**
 * Get app installation info
 */
export async function getAppInstallation(admin) {
  const query = `
    query {
      currentAppInstallation {
        id
        app {
          id
          handle
        }
        launchUrl
        uninstallUrl
        accessScopes {
          handle
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(query);
    const result = await response.json();
    return result.data?.currentAppInstallation;
  } catch (error) {
    console.error("Failed to get app installation:", error);
    throw error;
  }
}
// Database optimization utilities and query builders

import prisma from "../../db.server";
import { logger, createRequestTimer } from "../utils/logger";
import { withDbCache } from "../utils/cache";

// Optimized query builders with caching and performance monitoring
export class OptimizedQueries {
  
  // Get user with related data efficiently
  static async getUserWithStats(userId) {
    const timer = createRequestTimer();
    
    try {
      const result = await withDbCache(
        'user_with_stats',
        userId,
        async () => {
          return await prisma.user.findUnique({
            where: { id: userId },
            include: {
              shop: {
                select: {
                  shopDomain: true,
                  shopName: true,
                  isActive: true
                }
              },
              _count: {
                select: {
                  stories: {
                    where: { status: 'completed' }
                  }
                }
              },
              userPreferences: {
                select: {
                  key: true,
                  value: true
                }
              }
            }
          });
        },
        300 // 5 minutes cache
      );
      
      timer.end('db:getUserWithStats');
      return result;
      
    } catch (error) {
      timer.end('db:getUserWithStats:error');
      throw error;
    }
  }

  // Get paginated stories with efficient loading
  static async getPaginatedStories(userId, options = {}) {
    const {
      page = 1,
      limit = 10,
      status = null,
      theme = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const timer = createRequestTimer();
    const skip = (page - 1) * limit;

    try {
      // Build where clause
      const where = {
        userId,
        ...(status && { status }),
        ...(theme && { theme })
      };

      // Execute count and data queries in parallel
      const [stories, totalCount] = await Promise.all([
        prisma.story.findMany({
          where,
          include: {
            pages: {
              take: 1, // Only first page for list view
              orderBy: { pageNumber: 'asc' },
              select: {
                id: true,
                pageNumber: true,
                imageUrl: true
              }
            },
            _count: {
              select: { pages: true }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        }),
        prisma.story.count({ where })
      ]);

      const result = {
        stories,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        }
      };

      timer.end('db:getPaginatedStories');
      return result;

    } catch (error) {
      timer.end('db:getPaginatedStories:error');
      throw error;
    }
  }

  // Get complete story with all related data
  static async getCompleteStory(storyId, userId) {
    const timer = createRequestTimer();

    try {
      const result = await withDbCache(
        'complete_story',
        `${storyId}:${userId}`,
        async () => {
          return await prisma.story.findFirst({
            where: {
              id: storyId,
              userId // Ensure user owns the story
            },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              template: {
                select: {
                  id: true,
                  name: true,
                  theme: true
                }
              },
              pages: {
                orderBy: { pageNumber: 'asc' },
                include: {
                  images: {
                    select: {
                      id: true,
                      imageUrl: true,
                      prompt: true,
                      style: true
                    }
                  },
                  audioFiles: {
                    select: {
                      id: true,
                      audioUrl: true,
                      duration: true,
                      status: true
                    }
                  }
                }
              },
              shares: {
                where: {
                  OR: [
                    { expiresAt: null },
                    { expiresAt: { gte: new Date() } }
                  ]
                },
                select: {
                  id: true,
                  shareToken: true,
                  isPublic: true,
                  expiresAt: true,
                  viewCount: true
                }
              },
              _count: {
                select: {
                  pages: true,
                  images: true,
                  audioFiles: true
                }
              }
            }
          });
        },
        1800 // 30 minutes cache for complete stories
      );

      timer.end('db:getCompleteStory');
      return result;

    } catch (error) {
      timer.end('db:getCompleteStory:error');
      throw error;
    }
  }

  // Batch create story pages efficiently
  static async createStoryPages(storyId, pagesData) {
    const timer = createRequestTimer();

    try {
      // Use transaction for consistency
      const result = await prisma.$transaction(async (tx) => {
        const pages = await Promise.all(
          pagesData.map((pageData, index) =>
            tx.storyPage.create({
              data: {
                storyId,
                pageNumber: index + 1,
                ...pageData
              }
            })
          )
        );

        // Update story status
        await tx.story.update({
          where: { id: storyId },
          data: {
            status: 'completed',
            publishedAt: new Date(),
            updatedAt: new Date()
          }
        });

        return pages;
      });

      timer.end('db:createStoryPages');
      return result;

    } catch (error) {
      timer.end('db:createStoryPages:error');
      throw error;
    }
  }

  // Get dashboard analytics efficiently
  static async getDashboardAnalytics(userId) {
    const timer = createRequestTimer();

    try {
      const result = await withDbCache(
        'dashboard_analytics',
        userId,
        async () => {
          // Execute all analytics queries in parallel
          const [
            totalStories,
            storiesByStatus,
            storiesByTheme,
            recentActivity,
            monthlyStats
          ] = await Promise.all([
            // Total stories count
            prisma.story.count({
              where: { userId }
            }),

            // Stories by status
            prisma.story.groupBy({
              by: ['status'],
              where: { userId },
              _count: { id: true }
            }),

            // Stories by theme
            prisma.story.groupBy({
              by: ['theme'],
              where: { userId },
              _count: { id: true },
              orderBy: { _count: { id: 'desc' } },
              take: 5
            }),

            // Recent activity (last 10 stories)
            prisma.story.findMany({
              where: { userId },
              select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
                updatedAt: true
              },
              orderBy: { updatedAt: 'desc' },
              take: 10
            }),

            // Monthly story creation stats
            prisma.$queryRaw`
              SELECT 
                strftime('%Y-%m', createdAt) as month,
                COUNT(*) as count
              FROM stories 
              WHERE userId = ${userId}
                AND createdAt >= datetime('now', '-6 months')
              GROUP BY strftime('%Y-%m', createdAt)
              ORDER BY month DESC
            `
          ]);

          return {
            totalStories,
            storiesByStatus: storiesByStatus.reduce((acc, item) => {
              acc[item.status] = item._count.id;
              return acc;
            }, {}),
            storiesByTheme: storiesByTheme.map(item => ({
              theme: item.theme,
              count: item._count.id
            })),
            recentActivity,
            monthlyStats
          };
        },
        600 // 10 minutes cache for analytics
      );

      timer.end('db:getDashboardAnalytics');
      return result;

    } catch (error) {
      timer.end('db:getDashboardAnalytics:error');
      throw error;
    }
  }

  // Bulk update story statuses (for batch operations)
  static async bulkUpdateStoryStatus(storyIds, status) {
    const timer = createRequestTimer();

    try {
      const result = await prisma.story.updateMany({
        where: {
          id: { in: storyIds }
        },
        data: {
          status,
          updatedAt: new Date()
        }
      });

      timer.end('db:bulkUpdateStoryStatus');
      return result;

    } catch (error) {
      timer.end('db:bulkUpdateStoryStatus:error');
      throw error;
    }
  }

  // Clean up old data efficiently
  static async cleanupOldData(daysOld = 90) {
    const timer = createRequestTimer();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Clean up old failed stories
        const deletedStories = await tx.story.deleteMany({
          where: {
            status: 'failed',
            createdAt: { lt: cutoffDate }
          }
        });

        // Clean up expired shares
        const deletedShares = await tx.storyShare.deleteMany({
          where: {
            expiresAt: { lt: new Date() }
          }
        });

        // Clean up inactive shops and users
        const deactivatedShops = await tx.shop.updateMany({
          where: {
            isActive: false,
            updatedAt: { lt: cutoffDate }
          },
          data: {
            // Mark for potential deletion
            shopSettings: { markedForDeletion: true }
          }
        });

        return {
          deletedStories: deletedStories.count,
          deletedShares: deletedShares.count,
          deactivatedShops: deactivatedShops.count
        };
      });

      timer.end('db:cleanupOldData');
      logger.info('Database cleanup completed', result);
      return result;

    } catch (error) {
      timer.end('db:cleanupOldData:error');
      throw error;
    }
  }
}

// Database connection monitoring
export function monitorDatabaseHealth() {
  setInterval(async () => {
    try {
      const timer = createRequestTimer();
      
      // Simple health check query
      await prisma.$queryRaw`SELECT 1`;
      
      const duration = timer.end('db:health_check');
      
      if (duration > 1000) { // Log slow health checks
        logger.warn('Slow database health check', { duration });
      }
      
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
    }
  }, 30000); // Check every 30 seconds
}

// Start monitoring in production
if (process.env.NODE_ENV === 'production') {
  monitorDatabaseHealth();
}
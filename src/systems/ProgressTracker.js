/**
 * Progress Tracker System
 * Manages player achievements, statistics, and learning progress tracking
 * Handles badges, milestones, and progress visualization
 */

import { eventBus } from '../core/EventBus.js';
import { clamp } from '../utils/math.js';
import { PROGRESS_CONFIG } from '../config/constants.js';

export class ProgressTracker {
  constructor() {
    this.name = 'ProgressTracker';
    this.enabled = true;
    this.debugMode = false;
    
    // Progress data
    this.playerStats = {
      totalTime: 0,
      sessionsCount: 0,
      currentSession: {
        startTime: Date.now(),
        duration: 0,
        branchesVisited: [],
        achievementsEarned: []
      }
    };
    
    // Learning progress
    this.learningProgress = {
      overallProgress: 0,
      categoryProgress: new Map(),
      skillLevels: new Map(),
      masteryPoints: 0,
      streakData: {
        current: 0,
        longest: 0,
        lastActivity: null
      }
    };
    
    // Achievements system
    this.achievements = [];
    this.earnedAchievements = new Set();
    this.achievementProgress = new Map();
    
    // Milestones and goals
    this.milestones = [];
    this.completedMilestones = new Set();
    this.currentGoals = [];
    this.goalProgress = new Map();
    
    // Statistics tracking
    this.statistics = {
      branchesCompleted: 0,
      branchesStarted: 0,
      totalLessons: 0,
      averageScore: 0,
      timePerCategory: new Map(),
      difficultyDistribution: new Map(),
      learningVelocity: 0,
      retentionRate: 0
    };
    
    // Performance analytics
    this.analytics = {
      sessionData: [],
      learningPatterns: [],
      difficultyProgression: [],
      timeDistribution: new Map(),
      engagementMetrics: {
        averageSessionTime: 0,
        returnRate: 0,
        completionRate: 0
      }
    };
    
    // Notification system
    this.notifications = [];
    this.pendingNotifications = [];
    
    this.init();
  }

  /**
   * Initialize progress tracker
   */
  init() {
    this.loadProgressConfig();
    this.setupEventListeners();
    this.initializeAchievements();
    this.initializeMilestones();
    this.loadSavedProgress();
    this.startSession();
    
    if (this.debugMode) {
      console.log('📊 Progress Tracker initialized');
    }
    
    eventBus.emit('progress-tracker:initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Branch events
    eventBus.on('branch:entered', (data) => this.onBranchEntered(data));
    eventBus.on('branch:completed', (data) => this.onBranchCompleted(data));
    eventBus.on('branch:progress-updated', (data) => this.onBranchProgress(data));
    
    // Player events
    eventBus.on('player:updated', (data) => this.onPlayerActivity(data));
    
    // Timeline events
    eventBus.on('timeline:lesson-completed', (data) => this.onLessonCompleted(data));
    eventBus.on('timeline:quiz-completed', (data) => this.onQuizCompleted(data));
    
    // Session events
    eventBus.on('game:pause', () => this.pauseSession());
    eventBus.on('game:resume', () => this.resumeSession());
    eventBus.on('game:session-end', () => this.endSession());
    
    // World events
    eventBus.on('zone:entered', (data) => this.onZoneEntered(data));
    eventBus.on('world:milestone-reached', (data) => this.onMilestoneReached(data));
  }

  /**
   * Load progress configuration
   */
  loadProgressConfig() {
    this.config = {
      streakTimeout: PROGRESS_CONFIG.streakTimeout || 86400000, // 24 hours
      achievementNotificationDuration: PROGRESS_CONFIG.achievementNotificationDuration || 5000,
      milestoneRewardMultiplier: PROGRESS_CONFIG.milestoneRewardMultiplier || 1.5,
      masteryThreshold: PROGRESS_CONFIG.masteryThreshold || 85,
      retentionWindow: PROGRESS_CONFIG.retentionWindow || 604800000, // 7 days
      analyticsBufferSize: PROGRESS_CONFIG.analyticsBufferSize || 100
    };
  }

  /**
   * Initialize achievements system
   */
  initializeAchievements() {
    this.achievements = [
      {
        id: 'first-steps',
        name: 'First Steps',
        description: 'Complete your first branch',
        icon: 'trophy',
        category: 'milestone',
        rarity: 'common',
        requirements: {
          branchesCompleted: 1
        },
        reward: {
          masteryPoints: 10,
          title: 'Beginner'
        }
      },
      
      {
        id: 'speed-learner',
        name: 'Speed Learner',
        description: 'Complete a branch in under 10 minutes',
        icon: 'lightning',
        category: 'performance',
        rarity: 'uncommon',
        requirements: {
          branchCompletionTime: 600000 // 10 minutes
        },
        reward: {
          masteryPoints: 25,
          badge: 'speed-learner'
        }
      },
      
      {
        id: 'knowledge-seeker',
        name: 'Knowledge Seeker',
        description: 'Complete 10 branches',
        icon: 'book',
        category: 'milestone',
        rarity: 'uncommon',
        requirements: {
          branchesCompleted: 10
        },
        reward: {
          masteryPoints: 50,
          title: 'Scholar'
        }
      },
      
      {
        id: 'streak-master',
        name: 'Streak Master',
        description: 'Maintain a 7-day learning streak',
        icon: 'fire',
        category: 'engagement',
        rarity: 'rare',
        requirements: {
          streak: 7
        },
        reward: {
          masteryPoints: 75,
          badge: 'streak-master'
        }
      },
      
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Complete 5 branches with 100% score',
        icon: 'star',
        category: 'performance',
        rarity: 'rare',
        requirements: {
          perfectScores: 5
        },
        reward: {
          masteryPoints: 100,
          title: 'Perfectionist'
        }
      },
      
      {
        id: 'master-learner',
        name: 'Master Learner',
        description: 'Complete all available branches',
        icon: 'crown',
        category: 'completion',
        rarity: 'legendary',
        requirements: {
          allBranchesCompleted: true
        },
        reward: {
          masteryPoints: 500,
          title: 'Master',
          badge: 'master-learner'
        }
      }
    ];
    
    // Initialize achievement progress tracking
    for (const achievement of this.achievements) {
      this.achievementProgress.set(achievement.id, {
        progress: 0,
        completed: false,
        earnedAt: null
      });
    }
  }

  /**
   * Initialize milestones system
   */
  initializeMilestones() {
    this.milestones = [
      {
        id: 'welcome',
        name: 'Welcome to SparkIT',
        description: 'Start your learning journey',
        progress: 0,
        target: 1,
        category: 'onboarding',
        reward: {
          masteryPoints: 5,
          unlocks: ['intro-tutorial']
        }
      },
      
      {
        id: 'foundation',
        name: 'Foundation Builder',
        description: 'Complete fundamental branches',
        progress: 0,
        target: 3,
        category: 'fundamentals',
        reward: {
          masteryPoints: 30,
          unlocks: ['intermediate-content']
        }
      },
      
      {
        id: 'specialist',
        name: 'Specialist',
        description: 'Master a specific category',
        progress: 0,
        target: 1,
        category: 'mastery',
        reward: {
          masteryPoints: 100,
          title: 'Specialist',
          unlocks: ['advanced-content']
        }
      },
      
      {
        id: 'polymath',
        name: 'Polymath',
        description: 'Complete branches in 5 different categories',
        progress: 0,
        target: 5,
        category: 'diversity',
        reward: {
          masteryPoints: 200,
          title: 'Polymath',
          unlocks: ['expert-content']
        }
      }
    ];
  }

  /**
   * Update progress tracker - called every frame
   * @param {number} deltaTime - Frame delta time
   * @param {Object} gameState - Current game state
   */
  update(deltaTime, gameState) {
    if (!this.enabled) return;
    
    // Update session time
    this.updateSessionTime(deltaTime);
    
    // Update streaks
    this.updateStreaks();
    
    // Check achievements
    this.checkAchievements(gameState);
    
    // Update milestones
    this.updateMilestones(gameState);
    
    // Update analytics
    this.updateAnalytics(deltaTime, gameState);
    
    // Process notifications
    this.updateNotifications(deltaTime);
    
    // Sync to game state
    this.syncToGameState(gameState);
    
    eventBus.emit('progress-tracker:updated', { deltaTime });
  }

  /**
   * Update session time tracking
   * @param {number} deltaTime - Delta time
   */
  updateSessionTime(deltaTime) {
    this.playerStats.currentSession.duration += deltaTime;
    this.playerStats.totalTime += deltaTime;
  }

  /**
   * Update streak tracking
   */
  updateStreaks() {
    const now = Date.now();
    const { streakData } = this.learningProgress;
    
    if (streakData.lastActivity) {
      const timeSinceLastActivity = now - streakData.lastActivity;
      
      // Check if streak should be broken
      if (timeSinceLastActivity > this.config.streakTimeout) {
        if (streakData.current > 0) {
          eventBus.emit('progress:streak-broken', { 
            streak: streakData.current 
          });
          streakData.current = 0;
        }
      }
    }
  }

  /**
   * Check and update achievements
   * @param {Object} gameState - Game state
   */
  checkAchievements(gameState) {
    for (const achievement of this.achievements) {
      const progress = this.achievementProgress.get(achievement.id);
      
      if (progress.completed) continue;
      
      const meetsRequirements = this.checkAchievementRequirements(achievement);
      
      if (meetsRequirements && !progress.completed) {
        this.earnAchievement(achievement);
      }
    }
  }

  /**
   * Check if achievement requirements are met
   * @param {Object} achievement - Achievement to check
   * @returns {boolean} Requirements met
   */
  checkAchievementRequirements(achievement) {
    const { requirements } = achievement;
    
    for (const [requirement, value] of Object.entries(requirements)) {
      switch (requirement) {
        case 'branchesCompleted':
          if (this.statistics.branchesCompleted < value) return false;
          break;
          
        case 'branchCompletionTime':
          // Check if any branch was completed within the time limit
          // This would need session tracking data
          break;
          
        case 'streak':
          if (this.learningProgress.streakData.current < value) return false;
          break;
          
        case 'perfectScores':
          // Count perfect scores from branch completion data
          break;
          
        case 'allBranchesCompleted':
          // Check if all available branches are completed
          break;
      }
    }
    
    return true;
  }

  /**
   * Award achievement to player
   * @param {Object} achievement - Achievement to award
   */
  earnAchievement(achievement) {
    this.earnedAchievements.add(achievement.id);
    
    const progress = this.achievementProgress.get(achievement.id);
    progress.completed = true;
    progress.earnedAt = Date.now();
    
    // Apply rewards
    if (achievement.reward) {
      this.applyAchievementReward(achievement.reward);
    }
    
    // Add session record
    this.playerStats.currentSession.achievementsEarned.push(achievement.id);
    
    // Create notification
    this.addNotification({
      type: 'achievement',
      achievement,
      duration: this.config.achievementNotificationDuration
    });
    
    eventBus.emit('achievement:earned', { achievement });
    
    if (this.debugMode) {
      console.log(`📊 Achievement earned: ${achievement.name}`);
    }
  }

  /**
   * Apply achievement reward
   * @param {Object} reward - Reward data
   */
  applyAchievementReward(reward) {
    if (reward.masteryPoints) {
      this.learningProgress.masteryPoints += reward.masteryPoints;
    }
    
    if (reward.title) {
      eventBus.emit('player:title-unlocked', { title: reward.title });
    }
    
    if (reward.badge) {
      eventBus.emit('player:badge-unlocked', { badge: reward.badge });
    }
    
    if (reward.unlocks) {
      eventBus.emit('content:unlocked', { content: reward.unlocks });
    }
  }

  /**
   * Update milestone progress
   * @param {Object} gameState - Game state
   */
  updateMilestones(gameState) {
    for (const milestone of this.milestones) {
      if (this.completedMilestones.has(milestone.id)) continue;
      
      const newProgress = this.calculateMilestoneProgress(milestone, gameState);
      
      if (newProgress !== milestone.progress) {
        milestone.progress = newProgress;
        
        eventBus.emit('milestone:progress-updated', { 
          milestone, 
          progress: newProgress 
        });
        
        // Check if milestone is completed
        if (newProgress >= milestone.target) {
          this.completeMilestone(milestone);
        }
      }
    }
  }

  /**
   * Calculate milestone progress
   * @param {Object} milestone - Milestone to calculate
   * @param {Object} gameState - Game state
   * @returns {number} Progress value
   */
  calculateMilestoneProgress(milestone, gameState) {
    switch (milestone.id) {
      case 'welcome':
        return this.statistics.branchesStarted > 0 ? 1 : 0;
        
      case 'foundation':
        // Count completed fundamental branches
        return Math.min(this.statistics.branchesCompleted, milestone.target);
        
      case 'specialist':
        // Check if any category has high completion rate
        for (const [category, progress] of this.learningProgress.categoryProgress) {
          if (progress >= this.config.masteryThreshold) {
            return 1;
          }
        }
        return 0;
        
      case 'polymath':
        // Count unique categories with completed branches
        return this.learningProgress.categoryProgress.size;
        
      default:
        return milestone.progress;
    }
  }

  /**
   * Complete a milestone
   * @param {Object} milestone - Milestone to complete
   */
  completeMilestone(milestone) {
    this.completedMilestones.add(milestone.id);
    
    // Apply rewards
    if (milestone.reward) {
      this.applyMilestoneReward(milestone.reward);
    }
    
    // Create notification
    this.addNotification({
      type: 'milestone',
      milestone,
      duration: this.config.achievementNotificationDuration * 1.5
    });
    
    eventBus.emit('milestone:completed', { milestone });
    
    if (this.debugMode) {
      console.log(`📊 Milestone completed: ${milestone.name}`);
    }
  }

  /**
   * Apply milestone reward
   * @param {Object} reward - Reward data
   */
  applyMilestoneReward(reward) {
    if (reward.masteryPoints) {
      const bonus = Math.floor(reward.masteryPoints * this.config.milestoneRewardMultiplier);
      this.learningProgress.masteryPoints += bonus;
    }
    
    if (reward.title) {
      eventBus.emit('player:title-unlocked', { title: reward.title });
    }
    
    if (reward.unlocks) {
      eventBus.emit('content:unlocked', { content: reward.unlocks });
    }
  }

  /**
   * Update analytics data
   * @param {number} deltaTime - Delta time
   * @param {Object} gameState - Game state
   */
  updateAnalytics(deltaTime, gameState) {
    // Track time distribution
    const currentHour = new Date().getHours();
    const currentTime = this.analytics.timeDistribution.get(currentHour) || 0;
    this.analytics.timeDistribution.set(currentHour, currentTime + deltaTime);
    
    // Update engagement metrics
    this.updateEngagementMetrics();
    
    // Calculate learning velocity
    this.calculateLearningVelocity();
  }

  /**
   * Update engagement metrics
   */
  updateEngagementMetrics() {
    const { engagementMetrics } = this.analytics;
    
    // Average session time
    if (this.analytics.sessionData.length > 0) {
      const totalSessionTime = this.analytics.sessionData.reduce(
        (sum, session) => sum + session.duration, 0
      );
      engagementMetrics.averageSessionTime = totalSessionTime / this.analytics.sessionData.length;
    }
    
    // Completion rate
    if (this.statistics.branchesStarted > 0) {
      engagementMetrics.completionRate = 
        (this.statistics.branchesCompleted / this.statistics.branchesStarted) * 100;
    }
  }

  /**
   * Calculate learning velocity
   */
  calculateLearningVelocity() {
    // Learning velocity = completed content / time spent
    if (this.playerStats.totalTime > 0) {
      const contentCompleted = this.statistics.branchesCompleted + this.statistics.totalLessons;
      this.statistics.learningVelocity = contentCompleted / (this.playerStats.totalTime / 3600000); // per hour
    }
  }

  /**
   * Update notifications
   * @param {number} deltaTime - Delta time
   */
  updateNotifications(deltaTime) {
    // Update active notifications
    this.notifications = this.notifications.filter(notification => {
      notification.timeLeft -= deltaTime;
      return notification.timeLeft > 0;
    });
    
    // Process pending notifications
    if (this.pendingNotifications.length > 0 && this.notifications.length < 3) {
      const nextNotification = this.pendingNotifications.shift();
      this.notifications.push(nextNotification);
    }
  }

  /**
   * Add notification
   * @param {Object} notification - Notification data
   */
  addNotification(notification) {
    const notificationData = {
      ...notification,
      id: `notification-${Date.now()}`,
      timeLeft: notification.duration || 3000,
      timestamp: Date.now()
    };
    
    if (this.notifications.length < 3) {
      this.notifications.push(notificationData);
    } else {
      this.pendingNotifications.push(notificationData);
    }
    
    eventBus.emit('notification:added', { notification: notificationData });
  }

  /**
   * Start new session
   */
  startSession() {
    this.playerStats.sessionsCount++;
    this.playerStats.currentSession = {
      startTime: Date.now(),
      duration: 0,
      branchesVisited: [],
      achievementsEarned: []
    };
    
    eventBus.emit('session:started', { 
      sessionCount: this.playerStats.sessionsCount 
    });
  }

  /**
   * End current session
   */
  endSession() {
    const session = {
      ...this.playerStats.currentSession,
      endTime: Date.now()
    };
    
    // Add to session history
    this.analytics.sessionData.push(session);
    
    // Limit session history size
    if (this.analytics.sessionData.length > this.config.analyticsBufferSize) {
      this.analytics.sessionData.shift();
    }
    
    // Save progress
    this.saveProgress();
    
    eventBus.emit('session:ended', { session });
    
    if (this.debugMode) {
      console.log(`📊 Session ended: ${session.duration}ms`);
    }
  }

  /**
   * Pause session tracking
   */
  pauseSession() {
    eventBus.emit('session:paused');
  }

  /**
   * Resume session tracking
   */
  resumeSession() {
    eventBus.emit('session:resumed');
  }

  /**
   * Handle branch entered
   * @param {Object} data - Branch data
   */
  onBranchEntered(data) {
    const { branch } = data;
    
    // Track branch visit
    this.playerStats.currentSession.branchesVisited.push(branch.id);
    this.statistics.branchesStarted++;
    
    // Update category progress
    const category = branch.category || 'general';
    if (!this.learningProgress.categoryProgress.has(category)) {
      this.learningProgress.categoryProgress.set(category, 0);
    }
    
    // Update streak
    this.updateStreak();
    
    eventBus.emit('progress:branch-started', { branch });
  }

  /**
   * Handle branch completed
   * @param {Object} data - Branch completion data
   */
  onBranchCompleted(data) {
    const { branch, completionData } = data;
    
    this.statistics.branchesCompleted++;
    
    // Update category progress
    const category = branch.category || 'general';
    const categoryProgress = this.learningProgress.categoryProgress.get(category) || 0;
    this.learningProgress.categoryProgress.set(category, categoryProgress + 1);
    
    // Track time spent in category
    if (completionData.timeSpent) {
      const categoryTime = this.statistics.timePerCategory.get(category) || 0;
      this.statistics.timePerCategory.set(category, categoryTime + completionData.timeSpent);
    }
    
    // Track difficulty distribution
    const difficulty = branch.difficulty || 1;
    const difficultyCount = this.statistics.difficultyDistribution.get(difficulty) || 0;
    this.statistics.difficultyDistribution.set(difficulty, difficultyCount + 1);
    
    // Update average score
    if (completionData.score) {
      const totalScore = this.statistics.averageScore * (this.statistics.branchesCompleted - 1) + completionData.score;
      this.statistics.averageScore = totalScore / this.statistics.branchesCompleted;
    }
    
    // Award mastery points
    const basePoints = (branch.difficulty || 1) * 10;
    const bonusPoints = completionData.score ? Math.floor((completionData.score / 100) * basePoints) : 0;
    this.learningProgress.masteryPoints += basePoints + bonusPoints;
    
    eventBus.emit('progress:branch-completed', { branch, completionData });
  }

  /**
   * Handle branch progress update
   * @param {Object} data - Progress data
   */
  onBranchProgress(data) {
    // Track incremental progress
    eventBus.emit('progress:incremental-update', data);
  }

  /**
   * Handle lesson completed
   * @param {Object} data - Lesson data
   */
  onLessonCompleted(data) {
    this.statistics.totalLessons++;
    
    // Award small mastery points for lesson completion
    this.learningProgress.masteryPoints += 2;
    
    eventBus.emit('progress:lesson-completed', data);
  }

  /**
   * Handle quiz completed
   * @param {Object} data - Quiz data
   */
  onQuizCompleted(data) {
    const { score, questions } = data;
    
    // Calculate retention rate contribution
    const retentionContribution = (score / questions.length) * 100;
    this.updateRetentionRate(retentionContribution);
    
    eventBus.emit('progress:quiz-completed', data);
  }

  /**
   * Handle player activity
   * @param {Object} data - Player data
   */
  onPlayerActivity(data) {
    // Track any player activity for engagement
    this.learningProgress.streakData.lastActivity = Date.now();
  }

  /**
   * Handle zone entered
   * @param {Object} data - Zone data
   */
  onZoneEntered(data) {
    const { zone } = data;
    
    // Track zone exploration
    eventBus.emit('progress:zone-explored', { zone });
  }

  /**
   * Handle milestone reached
   * @param {Object} data - Milestone data
   */
  onMilestoneReached(data) {
    // This is handled in updateMilestones
  }

  /**
   * Update streak data
   */
  updateStreak() {
    const now = Date.now();
    const { streakData } = this.learningProgress;
    
    // Check if this is a new day
    const lastActivityDate = streakData.lastActivity ? new Date(streakData.lastActivity) : null;
    const currentDate = new Date(now);
    
    if (!lastActivityDate || 
        lastActivityDate.toDateString() !== currentDate.toDateString()) {
      
      // New day - increment streak
      streakData.current++;
      
      if (streakData.current > streakData.longest) {
        streakData.longest = streakData.current;
        eventBus.emit('progress:new-streak-record', { 
          streak: streakData.longest 
        });
      }
    }
    
    streakData.lastActivity = now;
  }

  /**
   * Update retention rate
   * @param {number} newScore - New score to factor in
   */
  updateRetentionRate(newScore) {
    // Simple moving average for retention rate
    const weight = 0.1;
    this.statistics.retentionRate = 
      (1 - weight) * this.statistics.retentionRate + weight * newScore;
  }

  /**
   * Calculate overall progress percentage
   * @returns {number} Progress percentage (0-100)
   */
  calculateOverallProgress() {
    // This would be based on total available content
    // For now, use a simple calculation
    const totalAvailableBranches = 20; // This would come from content system
    
    this.learningProgress.overallProgress = 
      (this.statistics.branchesCompleted / totalAvailableBranches) * 100;
    
    return clamp(this.learningProgress.overallProgress, 0, 100);
  }

  /**
   * Get player level based on mastery points
   * @returns {Object} Level info
   */
  getPlayerLevel() {
    const points = this.learningProgress.masteryPoints;
    
    // Level calculation (exponential curve)
    const level = Math.floor(Math.sqrt(points / 100)) + 1;
    const pointsForCurrentLevel = Math.pow(level - 1, 2) * 100;
    const pointsForNextLevel = Math.pow(level, 2) * 100;
    const progressToNext = (points - pointsForCurrentLevel) / (pointsForNextLevel - pointsForCurrentLevel);
    
    return {
      level,
      points,
      progressToNext: clamp(progressToNext, 0, 1),
      pointsForNext: pointsForNextLevel - points
    };
  }

  /**
   * Load saved progress
   */
  loadSavedProgress() {
    try {
      const saved = localStorage.getItem('sparkit-progress');
      if (saved) {
        const data = JSON.parse(saved);
        
        // Restore progress data
        Object.assign(this.playerStats, data.playerStats || {});
        Object.assign(this.learningProgress, data.learningProgress || {});
        Object.assign(this.statistics, data.statistics || {});
        
        // Restore achievements
        if (data.earnedAchievements) {
          this.earnedAchievements = new Set(data.earnedAchievements);
        }
        
        // Restore milestones
        if (data.completedMilestones) {
          this.completedMilestones = new Set(data.completedMilestones);
        }
        
        if (this.debugMode) {
          console.log('📊 Progress data loaded');
        }
      }
    } catch (error) {
      console.warn('📊 Failed to load saved progress:', error);
    }
  }

  /**
   * Save current progress
   */
  saveProgress() {
    try {
      const progressData = {
        playerStats: this.playerStats,
        learningProgress: {
          ...this.learningProgress,
          categoryProgress: Array.from(this.learningProgress.categoryProgress.entries()),
          skillLevels: Array.from(this.learningProgress.skillLevels.entries())
        },
        statistics: {
          ...this.statistics,
          timePerCategory: Array.from(this.statistics.timePerCategory.entries()),
          difficultyDistribution: Array.from(this.statistics.difficultyDistribution.entries())
        },
        earnedAchievements: Array.from(this.earnedAchievements),
        completedMilestones: Array.from(this.completedMilestones),
        lastSaved: Date.now()
      };
      
      localStorage.setItem('sparkit-progress', JSON.stringify(progressData));
      
      eventBus.emit('progress:saved', { progressData });
    } catch (error) {
      console.warn('📊 Failed to save progress:', error);
    }
  }

  /**
   * Sync progress data to game state
   * @param {Object} gameState - Game state
   */
  syncToGameState(gameState) {
    if (!gameState.progress) {
      gameState.progress = {};
    }
    
    Object.assign(gameState.progress, {
      overallProgress: this.calculateOverallProgress(),
      playerLevel: this.getPlayerLevel(),
      masteryPoints: this.learningProgress.masteryPoints,
      currentStreak: this.learningProgress.streakData.current,
      longestStreak: this.learningProgress.streakData.longest,
      branchesCompleted: this.statistics.branchesCompleted,
      totalTime: this.playerStats.totalTime,
      sessionTime: this.playerStats.currentSession.duration,
      achievements: this.earnedAchievements.size,
      milestones: this.completedMilestones.size,
      notifications: this.notifications.length,
      averageScore: this.statistics.averageScore,
      learningVelocity: this.statistics.learningVelocity,
      retentionRate: this.statistics.retentionRate
    });
  }

  /**
   * Get progress tracker state
   * @returns {Object} Current state
   */
  getState() {
    return {
      overallProgress: this.calculateOverallProgress(),
      playerLevel: this.getPlayerLevel(),
      masteryPoints: this.learningProgress.masteryPoints,
      streak: this.learningProgress.streakData.current,
      branchesCompleted: this.statistics.branchesCompleted,
      achievements: this.earnedAchievements.size,
      milestones: this.completedMilestones.size,
      sessionTime: this.playerStats.currentSession.duration,
      totalTime: this.playerStats.totalTime,
      averageScore: this.statistics.averageScore,
      notifications: this.notifications.length
    };
  }

  /**
   * Enable/disable progress tracker
   * @param {boolean} enabled - Enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    eventBus.emit('progress-tracker:enabled-changed', { enabled });
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Cleanup progress tracker
   */
  destroy() {
    this.endSession();
    this.saveProgress();
    
    this.achievements = [];
    this.milestones = [];
    this.notifications = [];
    this.earnedAchievements.clear();
    this.completedMilestones.clear();
    
    eventBus.emit('progress-tracker:destroyed');
  }
}

export { ProgressTracker };

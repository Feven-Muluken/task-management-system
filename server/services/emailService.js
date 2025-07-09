const nodemailer = require('nodemailer');
const { emailConfig, validateEmailConfig } = require('../config/emailConfig');

// Create transporter configuration
const createTransporter = () => {
  // Validate email configuration
  const validation = validateEmailConfig();
  if (!validation.isValid) {
    console.warn('Email configuration issues:', validation.errors);
    return null;
  }

  // Use explicit service and auth fields for Gmail
  return nodemailer.createTransport({
    service: emailConfig.service,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.pass
    }
  });
};

// Email templates
const emailTemplates = {
  taskAssignment: (userName, taskTitle, projectName, taskDescription, taskDeadline) => ({
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🎉 You Have a New Task!</h2>
        <p>Hi ${userName},</p>
        <p>We're excited to let you know that you've been assigned a new task in the <strong>${projectName}</strong> project. Here are the details:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">${taskTitle}</h3>
          <p><strong>Description:</strong> ${taskDescription || 'No description provided.'}</p>
          <p><strong>Deadline:</strong> ${taskDeadline ? new Date(taskDeadline).toLocaleDateString() : 'No deadline set'}</p>
        </div>
        <p>Please log in to your task management system to view more details, update the status, or ask questions if you need clarification.</p>
        <p>Good luck, and thank you for your hard work!</p>
        <p style="margin-top: 32px;">Best regards,<br>Task Management Team</p>
      </div>
    `
  }),

  deadlineReminder: (userName, itemTitle, daysLeft, itemType) => ({
    subject: `Deadline Reminder: ${itemTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Deadline Reminder</h2>
        <p>Hello ${userName},</p>
        <p>This is a reminder that your ${itemType} is due soon:</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #1f2937; margin-top: 0;">${itemTitle}</h3>
          <p><strong>Due in:</strong> ${daysLeft} day${daysLeft > 1 ? 's' : ''}</p>
        </div>
        <p>Please ensure you complete this ${itemType} on time or request an extension if needed.</p>
        <p>Best regards,<br>Task Management Team</p>
      </div>
    `
  }),

  overdueNotification: (userName, itemTitle, overdueDays, itemType) => ({
    subject: `URGENT: ${itemType} Overdue - ${itemTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ Overdue Notification</h2>
        <p>Hello ${userName},</p>
        <p>Your ${itemType} is currently overdue:</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #1f2937; margin-top: 0;">${itemTitle}</h3>
          <p><strong>Overdue by:</strong> ${overdueDays} day${overdueDays > 1 ? 's' : ''}</p>
        </div>
        <p>Please complete this ${itemType} immediately or request an extension.</p>
        <p>Best regards,<br>Task Management Team</p>
      </div>
    `
  }),

  vacationRequest: (managerName, employeeName, startDate, endDate) => ({
    subject: `Vacation Request from ${employeeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Vacation Request</h2>
        <p>Hello ${managerName},</p>
        <p>${employeeName} has submitted a vacation request:</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
          <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>
        </div>
        <p>Please review and approve/reject this request in the task management system.</p>
        <p>Best regards,<br>Task Management Team</p>
      </div>
    `
  }),

  vacationResponse: (userName, approved, startDate, endDate) => ({
    subject: `Vacation Request ${approved ? 'Approved' : 'Rejected'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${approved ? '#059669' : '#dc2626'};">Vacation Request ${approved ? 'Approved' : 'Rejected'}</h2>
        <p>Hello ${userName},</p>
        <p>Your vacation request has been <strong>${approved ? 'approved' : 'rejected'}</strong>:</p>
        <div style="background-color: ${approved ? '#f0fdf4' : '#fef2f2'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${approved ? '#059669' : '#dc2626'};">
          <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
          <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>
        </div>
        <p>${approved ? 'Enjoy your vacation!' : 'Please contact your manager for more information.'}</p>
        <p>Best regards,<br>Task Management Team</p>
      </div>
    `
  }),

  issueUpdate: (userName, issueTitle, status) => ({
    subject: `Issue Update: ${issueTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Issue Update</h2>
        <p>Hello ${userName},</p>
        <p>An issue has been updated:</p>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #1f2937; margin-top: 0;">${issueTitle}</h3>
          <p><strong>New Status:</strong> ${status}</p>
        </div>
        <p>Please check the task management system for more details.</p>
        <p>Best regards,<br>Task Management Team</p>
      </div>
    `
  }),

  generalNotification: (userName, title, message) => ({
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${title}</h2>
        <p>Hello ${userName},</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>${message}</p>
        </div>
        <p>Best regards,<br>Task Management Team</p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
  try {
    // Check if email notifications are enabled
    if (!emailConfig.enableEmailNotifications) {
      console.log('Email notifications are disabled');
      return { success: false, error: 'Email notifications are disabled' };
    }

    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, error: 'Email transporter not configured' };
    }

    const emailContent = emailTemplates[template](...Object.values(data));

    const mailOptions = {
      from: emailConfig.from,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send notification email
const sendNotificationEmail = async (user, notification) => {
  try {
    // Determine email template based on notification type
    let template = 'generalNotification';
    let data = [user.name, notification.title || 'Notification', notification.message];

    switch (notification.type) {
      case 'task_assignment':
        template = 'taskAssignment';
        data = [user.name, notification.relatedItem?.title || 'Task', notification.relatedItem?.projectName || 'Project', notification.relatedItem?.description, notification.relatedItem?.deadline];
        break;
      case 'deadline_approaching':
        template = 'deadlineReminder';
        const daysLeft = notification.message.match(/(\d+)/)?.[1] || '1';
        data = [user.name, notification.relatedItem?.title || 'Item', daysLeft, notification.relatedItem?.type || 'task'];
        break;
      case 'deadline_overdue':
        template = 'overdueNotification';
        const overdueDays = notification.message.match(/(\d+)/)?.[1] || '1';
        data = [user.name, notification.relatedItem?.title || 'Item', overdueDays, notification.relatedItem?.type || 'task'];
        break;
      case 'vacation_request':
        template = 'vacationRequest';
        data = [user.name, notification.relatedItem?.employeeName || 'Employee', notification.relatedItem?.startDate, notification.relatedItem?.endDate];
        break;
      case 'vacation_response':
        template = 'vacationResponse';
        data = [user.name, notification.relatedItem?.approved || false, notification.relatedItem?.startDate, notification.relatedItem?.endDate];
        break;
      case 'issue_update':
        template = 'issueUpdate';
        data = [user.name, notification.relatedItem?.title || 'Issue', notification.relatedItem?.status || 'Updated'];
        break;
    }

    return await sendEmail(user.email, template, data);
  } catch (error) {
    console.error('Error sending notification email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  sendNotificationEmail,
  emailTemplates
}; 
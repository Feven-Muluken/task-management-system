# Email Notification Setup Guide

task management system  supports **email notifications**! Users will receive emails when:
- ✅ Tasks are assigned to them
- ✅ Deadlines are approaching
- ✅ Tasks become overdue
- ✅ Vacation requests are submitted/approved
- ✅ Issues are updated
- ✅ General notifications are sent

## 🚀 Quick Setup

### 1. Create Environment File
Create a `.env` file in the `server` directory with the following content:

```env
# Database Configuration
MONGO_URI=mongodb://127.0.0.1:27017/task_management

# Server Configuration
PORT=4000
NODE_ENV=development

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-digit-app-password
EMAIL_FROM=Task Management System <your-email@gmail.com>
ENABLE_EMAIL_NOTIFICATIONS=true
```

### 2. Email Provider Setup

#### **Gmail Setup (Recommended)**
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to [Google Account settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate a new app password
   - Copy the 16-digit password
3. **Update .env file**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-digit-app-password
   EMAIL_SERVICE=gmail
   ```

#### **Outlook Setup**
1. **Enable 2-Factor Authentication** on your Outlook account
2. **Generate App Password**:
   - Go to Account settings → Security
   - Advanced security options → App passwords
   - Generate a new app password
3. **Update .env file**:
   ```env
   EMAIL_USER=your-email@outlook.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_SERVICE=outlook
   ```

#### **Yahoo Setup**
1. **Enable 2-Factor Authentication** on your Yahoo account
2. **Generate App Password**:
   - Go to Account Security → App passwords
   - Generate a new app password
3. **Update .env file**:
   ```env
   EMAIL_USER=your-email@yahoo.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_SERVICE=yahoo
   ```

### 3. Test Email Configuration

Start your server and check the console for email configuration validation:

```bash
cd server
npm start
```

You should see:
- ✅ Email configuration validated
- ✅ Email notifications enabled

## 📧 Email Templates

The system includes beautiful, responsive email templates for:

### **Task Assignment**
- Subject: "New Task Assigned: [Task Title]"
- Includes task details and project information
- Professional styling with action buttons

### **Deadline Reminders**
- Subject: "Deadline Reminder: [Item Title]"
- Shows days remaining until deadline
- Color-coded urgency levels

### **Overdue Notifications**
- Subject: "URGENT: [Item Type] Overdue - [Item Title]"
- Highlights overdue items
- Urgent styling with warning icons

### **Vacation Requests**
- Subject: "Vacation Request from [Employee Name]"
- Shows vacation dates and details
- Manager approval workflow

### **Issue Updates**
- Subject: "Issue Update: [Issue Title]"
- Displays issue status changes
- Professional formatting

## 🔧 Configuration Options

### **Enable/Disable Email Notifications**
```env
# Enable email notifications
ENABLE_EMAIL_NOTIFICATIONS=true

# Disable email notifications
ENABLE_EMAIL_NOTIFICATIONS=false
```

### **Custom Email Sender**
```env
# Custom sender name
EMAIL_FROM=Your Company <your-email@gmail.com>
```

### **Email Service Options**
```env
# Gmail (recommended)
EMAIL_SERVICE=gmail

# Outlook
EMAIL_SERVICE=outlook

# Yahoo
EMAIL_SERVICE=yahoo

# Custom SMTP
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
```

## 🛠️ Troubleshooting

### **Common Issues**

1. **"Invalid login" error**
   - Make sure you're using an App Password, not your regular password
   - Verify 2-Factor Authentication is enabled

2. **"Less secure app access" error**
   - Use App Passwords instead of regular passwords
   - Enable 2-Factor Authentication

3. **Emails not sending**
   - Check console logs for error messages
   - Verify email configuration in .env file
   - Ensure ENABLE_EMAIL_NOTIFICATIONS=true

4. **Emails going to spam**
   - Add your email to the recipient's contacts
   - Use a business email domain if possible
   - Configure SPF/DKIM records for your domain

### **Testing Email Setup**

You can test the email configuration by:

1. **Creating a test user** with a valid email address
2. **Assigning a task** to that user
3. **Checking the user's email** for the notification

### **Logs and Debugging**

Check server console for email-related logs:
```
Email sent successfully: <message-id>
Email sending failed: <error-message>
```

## 📱 Email Features

### **Responsive Design**
- Works on desktop, tablet, and mobile
- Professional styling with company branding
- Clear call-to-action buttons

### **Smart Notifications**
- Only sends emails when necessary
- Tracks email delivery status
- Prevents duplicate emails

### **Customization**
- Easy to customize email templates
- Support for multiple email providers
- Configurable notification preferences

## 🔒 Security Best Practices

1. **Never commit .env files** to version control
2. **Use App Passwords** instead of regular passwords
3. **Enable 2-Factor Authentication** on email accounts
4. **Regularly rotate** email passwords
5. **Monitor email logs** for suspicious activity

## 🎉 Ready to Use!

Once configured, your task management system will automatically send professional email notifications for all important events. Users will stay informed about their tasks, deadlines, and team updates even when they're not actively using the system.

**Happy emailing! 📧✨** 
// Test Email Configuration
// Run this script to test if your email setup is working

const { validateEmailConfig } = require('./config/emailConfig');
const { sendEmail } = require('./services/emailService');
require('dotenv').config(); 
async function testEmailConfiguration() {
  console.log('🧪 Testing Email Configuration...\n');
  console.log('ENABLE_EMAIL_NOTIFICATIONS (raw):', process.env.ENABLE_EMAIL_NOTIFICATIONS);

  // Validate configuration
  const validation = validateEmailConfig();

  // Print actual config values for debugging
  console.log('DEBUG: EMAIL_USER:', validation.config.user);
  console.log('DEBUG: EMAIL_PASSWORD:', validation.config.pass);
  console.log('DEBUG: EMAIL_FROM:', validation.config.from);
  console.log('DEBUG: enableEmailNotifications:', validation.config.enableEmailNotifications);

  if (!validation.isValid) {
    console.log(': ❌ Email configuration issues found:');
    validation.errors.forEach(error => console.log(`   - ${error}`));
    console.log('\n📧 Please check your .env file and follow the setup instructions in EMAIL_SETUP.md');
    return;
  }

  console.log('✅ Email configuration is valid!');
  console.log(`📧 Service: ${validation.config.service}`);
  console.log(`📧 From: ${validation.config.from}`);
  console.log(`📧 Notifications enabled: ${validation.config.enableEmailNotifications}\n`);

  // Test email sending
  console.log('📤 Testing email sending...');

  try {
    const testResult = await sendEmail(
      validation.config.user, // Send to yourself for testing
      'generalNotification',
      ['Test User', 'Email Test', 'This is a test email to verify your email configuration is working correctly.']
    );

    if (testResult.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`📧 Message ID: ${testResult.messageId}`);
      console.log(`📧 Check your inbox at: ${validation.config.user}`);
    } else {
      console.log('❌ Failed to send test email:');
      console.log(`   Error: ${testResult.error}`);
    }
  } catch (error) {
    console.log('❌ Error during email test:');
    console.log(`   ${error.message}`);
  }
}

// Run the test
testEmailConfiguration().then(() => {
  console.log('\n🏁 Email test completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed with error:', error);
  process.exit(1);
}); 
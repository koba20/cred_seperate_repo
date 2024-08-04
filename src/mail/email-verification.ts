import config from "../../config/config"

const EMAIL_VERIFICATION = (firstName: string, token: string) =>{
  // `${token} ${firstName}`;
  return `
  <!DOCTYPE html>
  <html lang="en" >
  
  <head>
    <meta charset="UTF-8">
      <link rel="apple-touch-icon" type="image/png" href="https://cpwebassets.codepen.io/assets/favicon/apple-touch-icon-5ae1a0698dcc2402e9712f7d01ed509a57814f994c660df9f7a952f3060705ee.png" />
      <meta name="apple-mobile-web-app-title" content="CodePen">
      <link rel="shortcut icon" type="image/x-icon" href="https://cpwebassets.codepen.io/assets/favicon/favicon-aec34940fbc1a6e787974dcd360f2c6b63348d4b1f4e06c77743096d55480f33.ico" />
      <link rel="mask-icon" type="image/x-icon" href="https://cpwebassets.codepen.io/assets/favicon/logo-pin-b4b4269c16397ad2f0f7a01bcdf513a1994f4c94b8af2f191c09eb0d601762b1.svg" color="#111" />  
    <title>CodePen - OTP Email Template</title>
    <link rel="canonical" href="https://codepen.io/itsmanojb/pen/yLzpZXr">
    
  <style>
  @media only screen and (max-width: 620px) {
    table[class="body"] h1 {
      font-size: 28px !important;
      margin-bottom: 10px !important;
    }
    table[class="body"] p,
    table[class="body"] ul,
    table[class="body"] ol,
    table[class="body"] td,
    table[class="body"] span,
    table[class="body"] a {
      font-size: 16px !important;
    }
    table[class="body"] p {
      color: #555555 !important;
    }
    table[class="body"] .wrapper,
    table[class="body"] .article {
      padding: 10px !important;
    }
    table[class="body"] .content {
      padding: 0 !important;
    }
    table[class="body"] .container {
      padding: 0 !important;
      width: 100% !important;
    }
    table[class="body"] .main {
      border-left-width: 0 !important;
      border-radius: 0 !important;
      border-right-width: 0 !important;
    }
    table[class="body"] .btn table {
      width: 100% !important;
    }
    table[class="body"] .btn a {
      width: 100% !important;
    }
    table[class="body"] .img-responsive {
      height: auto !important;
      max-width: 100% !important;
      width: auto !important;
    }
  }
  
  /* ------------------------------------- 
  PRESERVE THESE STYLES IN THE HEAD 
  ------------------------------------- */
  
  @media all {
    .ExternalClass {
      width: 100%;
    }
    .ExternalClass,
    .ExternalClass p,
    .ExternalClass span,
    .ExternalClass font,
    .ExternalClass td,
    .ExternalClass div {
      line-height: 100%;
    }
    .apple-link a {
      color: inherit !important;
      font-family: inherit !important;
      font-size: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
      text-decoration: none !important;
    }
    #MessageViewBody a {
      color: inherit;
      text-decoration: none;
      font-size: inherit;
      font-family: inherit;
      font-weight: inherit;
      line-height: inherit;
    }
  }
  </style>
  
    <script>
    window.console = window.console || function(t) {};
  </script>
  
    
    
  </head>
  
  <body translate="no">
    <body class="" style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
    <span class="preheader" style="color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;"></span>
    <table border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background-color: #f6f6f6;">
      <tr>
        <td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; margin: 0 auto; max-width: 580px; width: 580px;">
          <div class="content" style="box-sizing: border-box; display: block; margin: 10px auto; max-width: 580px;">
  
            <!-- START CENTERED WHITE CONTAINER -->
            <table class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background: #ffffff; ">
  
              <!-- START MAIN CONTENT AREA -->
              <tr>
                <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 50px 20px !important;">
                  <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">
                    <tr>
                      <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">
                        <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">
                          Hi ${firstName},</p>
                        <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Your Login OTP for your account is: </p>
                        <br />
                        <table border="0" cellpadding="0" cellspacing="0" class="btn btn-primary" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; box-sizing: border-box;">
                          <tbody>
                            <tr>
                              <td align="center" style="font-family: sans-serif; font-size: 14px; vertical-align: top; padding-bottom: 15px;">
                                <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 50%;">
                                  <tbody>
                                    <tr>
                                      <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">
                                        <div style="color: #3498db; border: solid 1px #c4e6fd; box-sizing: border-box; cursor: pointer; text-decoration: none; font-size: 16px; font-weight: bold; margin: 0; padding: 12px 50px;text-align: center;background-color: #f3f7fa;width:100%">
                                          ${token}</div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <br>
                        <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;"> If you didn't request for password recovery, don't worry your account is absolutely safe. You can ignore this email. <br></p>
  
                        <p>In case you encounter any problem, please contact us at <a href="mailto:credxsupport@bnl-ltd.com" style="color: #3498db;font-size: 14px !important;">credxsupport@bnl-ltd.com</a>.</p>
                        <br>
                        <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">
                          Regards, <br>
                          Team ${config.appName}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
  
              <!-- END MAIN CONTENT AREA -->
            </table>
  
            <!-- START FOOTER -->
            <div class="footer" style="clear: both; margin-top: 10px; text-align: center; width: 100%;">
              <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">
                <tr>
                  <td align="center" class="content-block powered-by" style="font-family: sans-serif; vertical-align: top; padding-bottom: 10px; padding-top: 10px; font-size: 12px !important; color: #999999; text-align: center;">
                    <div style="text-align:center;padding: 0 20px">
                      <a href="bnl-ltd.com" style="color: #999999; font-size: 12px !important; text-decoration: none;">${config.appName}</a> &copy; 2020
                    </div>
                  </td>
                </tr>
              </table>
            </div>
            <!-- END FOOTER -->
  
            <!-- END CENTERED WHITE CONTAINER -->
          </div>
        </td>
  
      </tr>
    </table>
  </body>
  </body>
  </html>
  `
}
  

export default EMAIL_VERIFICATION;

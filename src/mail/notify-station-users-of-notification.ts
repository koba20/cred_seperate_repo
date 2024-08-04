const NOTIFY_STATION_USERS_OF_NOTIFICATION = (
  fullName: string,
  message: string
) => `
    <meta charset="UTF-8">
    <title>CredX</title>
</head>
<body>
    <div style="background-color: #f9f9f9; padding: 20px 0;">
        <div style="background-color: #fff; margin: 0 auto; max-width: 600px;">
            <div style="background-color: #fff; padding: 0 20px;">
                <div style="text-align: center; padding: 20px 0;">
                    <img src="http://localhost:3000/logo.png" alt="logo" style="width: 150px;">
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; text-align: center;">
                    <h1 style="color: #000; font-size: 24px; line-height: 28px; margin-bottom: 0;">
                        Hello ${fullName}
                    </h1>
                </div>
                <div style="padding: 20px;">
                    <p style="font-size: 14px; line-height: 20px; color: #000;">
                        ${message}
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>

<!DOCTYPE html>
<html lang="en">
<head>
`;

export default NOTIFY_STATION_USERS_OF_NOTIFICATION;

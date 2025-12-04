<?php
header('Content-Type: application/json');
$SENDGRID_API_KEY = getenv('SENDGRID_API_KEY') ?: 'YOUR_SENDGRID_API_KEY_HERE';
$FROM_EMAIL = getenv('FROM_EMAIL') ?: 'support@surudigitalcare.com';
$toEmails = ['support@surudigitalcare.com', 'SuruDigitalCare@gmail.com'];
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$service = trim($_POST['service'] ?? '');
$message = trim($_POST['message'] ?? '');
if(!$name || !$email || !$service || !$message){
  echo json_encode(['success'=>false,'error'=>'Missing required fields']);
  exit;
}
$subject = "New Estimate Request: " . $service;
$body = "Name: $name\nEmail: $email\nPhone: $phone\nService: $service\n\nMessage:\n$message\n";
$logLine = [date('c'),$name,$email,$phone,$service,str_replace(["\n","\r"],' ',$message)];
$logFile = __DIR__ . '/../submissions.csv';
$fp = fopen($logFile,'a');
if($fp){ fputcsv($fp, $logLine); fclose($fp); }
$payload = [
  'personalizations' => [[ 'to' => array_map(function($e){ return ['email'=>$e]; }, $toEmails), 'subject' => $subject ]],
  'from' => ['email' => $FROM_EMAIL],
  'reply_to' => ['email' => $email],
  'content' => [['type'=>'text/plain','value'=>$body]]
];
$ch = curl_init('https://api.sendgrid.com/v3/mail/send');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $SENDGRID_API_KEY, 'Content-Type: application/json']);
$result = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlerr = curl_error($ch);
curl_close($ch);
if($result === false || $httpcode >= 400){
  echo json_encode(['success'=>false,'error'=>"SendGrid error: $httpcode $curlerr"]);
} else { echo json_encode(['success'=>true]); }
?>
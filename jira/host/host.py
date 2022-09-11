import nativemessaging
import win32com.client as win32
import sys
import os
import xlsxwriter

def sendMail(data):
  toList = data["to"]
  ccList = data["cc"]
  subject = data["subject"]
  email_content = data["content"]
  try:
    outlook = win32.Dispatch('outlook.application')
    mail = outlook.CreateItem(0)
    mail.To = toList
    mail.Cc = ccList
    mail.Subject = subject
    mail.Body = ''
    mail.HTMLBody = email_content
    mail.Send()
    return True
  except:
    return False

commandList = {
  "send_mail": sendMail,
}

while True:
  message = nativemessaging.get_message()
  command = commandList.get(message["command"], None)

  if not command:
    nativemessaging.send_message(
      nativemessaging.encode_message("Command not found"))
  else:
    result = command(message)
    nativemessaging.send_message(nativemessaging.encode_message(result))

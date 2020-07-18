# !/bin/bash
source .env

if [ -n "$S3_DESTINATION" ] && [ -n "$S3_SOURCE" ] && [ -n "$AWS_ACCESSID" ] && [ -n "$AWS_SECRET" ] && [ -n "$S3_BUCKET" ]; then
  echo -e "COPYING FILES FROM \033[1m"$S3_SOURCE"\033[0m TO \033[1m"$S3_DESTINATION"\033[0m"
else
  echo -e "\nYou must have these 5 variables in your .env file\n\n\033[1m"S3_SOURCE"\033[0m \n\033[1m"S3_DESTINATION"\033[0m\n\033[1m"S3_BUCKET"\033[0m\n\033[1m"AWS_SECRET"\033[0m\n\033[1m"AWS_ACCESSID"\033[0m\n"
  echo "Insufficient variables"
  exit
fi
printf "\npress \033[1mY\033[0m to continue OR any other to exit\n\n"

read -p "Are you sure?? [y/any key]" -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "Starting copying files"
else
  printf "\nOK"
  exit
fi


printf "\nConfiguring AWS\n"
aws configure set aws_access_key_id $AWS_ACCESSID 
aws configure set aws_secret_access_key  $AWS_SECRET

printf "\nCOPYING\n\n"
aws s3 sync s3://$S3_BUCKET/$S3_SOURCE s3://$S3_BUCKET/$S3_DESTINATION  --acl public-read

aws configure set aws_access_key_id ''
aws configure set aws_secret_access_key  ''

printf "Done\n"

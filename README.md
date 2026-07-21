# JobMeerkat API

This is the API code for the Job Meerkat project.

## Tech Stack
It is a **Serverless Framework** project deployed in **AWS** and using:
 - **Lambda** functions written in **Typescript**
 - **Cheerio** to scrap companies jobs
 - **OpenAi** to analyze job posts
 - **DynamoDB** as storage
 - **SQS** as queues system
 - **Jest** for unit testing

## Create company

`POST /company`

```json
{
  "name": "Acme",
  "homePage": "https://acme.com",
  "description": "Acme builds tools for remote teams to collaborate on product work."
}
```

`description` is optional. Sample event for local invoke: `src/company/infrastructure/api/createCompany.event.json`.

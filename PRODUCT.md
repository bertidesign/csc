# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Confirmed: Next.js App Router and TypeScript on Vercel, Neon Postgres with Drizzle, and Clerk for authentication.

## Users

- Platform administrator creates customer tenants and invites their users.
- Tenant users configure surveys and review customer feedback.
- Customers answer surveys anonymously.

## Product Purpose

Customer Satisfaction Collector (CSC) lets organizations collect customer satisfaction feedback and review detailed results.

## Positioning

Open: no distinct market position or differentiating claim has been specified.

## Operating Context

The platform administrator creates tenants. Tenant users configure surveys. Customers submit anonymous feedback. Tenant users use dashboards with segments and comparisons.

## Capabilities and Constraints

- Multi-tenant data model.
- Surveys are configurable for each tenant, including questions, scales, and comments.
- Feedback is anonymous.
- Dashboard supports detailed analysis with segments and comparisons.
- White label initially covers each tenant's logo and colors.
- Product billing is out of scope for the initial version.
- Survey distribution channels, export formats, tenant roles, retention rules, and supported locales remain open.
- Hosting target is Vercel; database is Neon.

## Brand Commitments

- Product name: Customer Satisfaction Collector (CSC).
- Product interface and feedback experience use Italian initially as an implementation default; locale requirements remain open.

## Product Principles

- Keep each tenant's data isolated.
- Make anonymous feedback the default collection model.
- Let tenant users adapt surveys to their service.
- Present trends and segments clearly enough to act on feedback.
- Keep white label limited to tenant identity until scope expands.

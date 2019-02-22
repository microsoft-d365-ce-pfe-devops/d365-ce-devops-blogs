
# Introduction to DevOps for Dynamics 365
  
In this blog series, we will explore building out DevOps processes and practices for Dynamics 365 Customer Engagement (CE) by following the growth of our fictional company Contoso University. If you want to learn the

An explanation of what DevOps is and a deeper look into the practices, processes, and principles as they apply more broadly can be found at [aka.ms/DevOps](https://aka.ms/Devops). For quick reference, we'll just include a note on what DevOps is before we move on...

>DevOps is the union of people, process, and products to enable continuous delivery of value to our end users. The contraction of “Dev” and “Ops” refers to replacing siloed Development and Operations to create multidisciplinary teams that now work together with shared and efficient practices and tools. Essential DevOps practices include agile planning, continuous integration, continuous delivery, and monitoring of applications. (Sam Guckenheimer, [What is DevOps?](https://docs.microsoft.com/en-us/azure/devops/learn/what-is-devops))

**Disclaimer**: This is by no means an exhaustive look into DevOps practices and principles. The intent is to take an applied look at how one may approach building out a DevOps practice and evolving their implementation over time. We will be sticking to YAML based build pipelines to build an understanding in the components and technologies used to achieve our goal. YAML pipelines will also allow us to easily submit each lesson into version control and share our examples.

## Getting Started

In the most basic setup of Dynamics 365 CE development, deployment and testing is a manual process. We modify a solution, export the solution and import that solution into some downstream environment, then manually test to ensure there are no issue with solution layering, integrations, etc. That gets old quick, what we really want is to automate as much as is reasonable given some set budget, level of expertise and set of business constraints. The first step we can take is implement the practice of version control for our solutions.

## Setup an Azure D

## Version Control for Solutions
Dynamics 365 CE solutions can be version controlled 

## Resources

- https://aka.ms/DevOps
<!--stackedit_data:
eyJoaXN0b3J5IjpbMTQ4MzkxNDkzOSwtODg0Nzc1MjYzXX0=
-->

# Introduction to DevOps for Dynamics 365 Customer Engagement
  
In this blog series, we will explore building out DevOps processes and practices for Dynamics 365 Customer Engagement (CE) by following the growth of our fictional company Contoso University. If you want to learn the

An explanation of what DevOps is and a deeper look into the practices, processes, and principles as they apply more broadly can be found at [aka.ms/DevOps](https://aka.ms/Devops). For quick reference, we'll just include a note on what DevOps is before we move on...

>DevOps is the union of people, process, and products to enable continuous delivery of value to our end users. The contraction of “Dev” and “Ops” refers to replacing siloed Development and Operations to create multidisciplinary teams that now work together with shared and efficient practices and tools. Essential DevOps practices include agile planning, continuous integration, continuous delivery, and monitoring of applications. (Sam Guckenheimer, [What is DevOps?](https://docs.microsoft.com/en-us/azure/devops/learn/what-is-devops))

**Disclaimer**: This is by no means an exhaustive look into DevOps practices and principles. The intent is to take an applied look at how one may approach building out a DevOps practice and evolving their implementation over time. We will be sticking to YAML based build pipelines to build an understanding in the components and technologies used to achieve our goal. YAML pipelines will also allow us to easily submit each lesson into version control and share our examples.

## Getting started

In the most basic setup of Dynamics 365 CE development, deployment and testing is a manual process. We modify a solution, export the solution and import that solution into some downstream environment, then manually test to ensure there are no issue with solution layering, integrations, etc. That gets old quick, what we really want is to automate as much as is reasonable given some set budget, level of expertise and set of business constraints. The first step we can take is implement the practice of version control for our solutions and automate migrating our solutions between environments; To do this we will be using Azure DevOps.

If you are unfamiliar with Azure DevOps and need to setup a new account please start with the [Get started guide for Azure Repos](https://docs.microsoft.com/en-us/azure/devops/repos/get-started/?view=azure-devops) documentation. Once you have setup of the basic environment and have an empty project jump back over herI'me. 

## Version control for solutions
Dynamics 365 CE solutions can be version controlled using [Solution Packager](https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/compress-extract-solution-file-solutionpackager). The tool is included as part of a Nuget package so we will need to fire up a PowerShell console to download a copy; in a future blog we will include this in our automation process, for now let's learn the basics.

TODO
- How to download PowerShell/other
- Command to unpack
- Checking in to version control

## Moving solutions between environments

## Resources

- https://aka.ms/DevOps
- [What is DevOps?](https://docs.microsoft.com/en-us/azure/devops/learn/what-is-devops)
- [Get started guide for Azure Repos](https://docs.microsoft.com/en-us/azure/devops/repos/get-started/?view=azure-devops)
- [Solution Packager](https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/compress-extract-solution-file-solutionpackager)

<!--stackedit_data:
eyJoaXN0b3J5IjpbNzQwMDQ3ODc0LC0zMDgzNTc3NTYsMTk1MT
Q3NTc0LC01NDE2NjA3NDIsLTg4NDc3NTI2M119
-->
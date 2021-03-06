# Refactoring Azure DevOps Pipelines and Implementing PowerApps Checker in DevOps for Dynamics 365 for Customer Engagement Solutions - DevOps Part 2

<div><img src="https://github.com/microsoft-d365-ce-pfe-devops/d365-ce-devops-blogs/raw/master/media/devops/pipeline-templates/blog-icon.png"/></div>

Welcome to the next entry in our blog series on DevOps for Dynamics 365 for Customer Engagement (D365 CE). Up until now, we've covered the following:

- [Introduction to DevOps for Dynamics 365 Customer Engagement using YAML Based Azure Pipelines](https://community.dynamics.com/crm/b/crminthefield/archive/2019/02/27/introduction-to-devops-for-dynamics-365-customer-engagement-using-yaml-based-azure-pipelines)
  - Unpack PowerApps solutions into source control.
  - Use YAML pipelines to pack solutions and import them into a target environment.
  - [Introduction to DevOps for Dynamics 365 Customer Engagement using YAML Based Azure Pipelines - Part 1.5](https://community.dynamics.com/crm/b/crminthefield/archive/2019/05/09/introduction-to-devops-for-dynamics-365-customer-engagement-using-yaml-based-azure-pipelines-part-1-5)
    - Take advantage of the [new multi-stage YAML pipelines](https://mybuild.techcommunity.microsoft.com/sessions/77791?source=sessions#top-anchor) in Azure DevOps to break our pipeline into logical stages.
    - Download build artifacts for the deployment stage of our pipeline.

This article will build on the material covered so far, so if you want to follow along and you haven't walked through those articles yet, I'd recommend you do so.

## Contents

- [Introduction](#introduction)
- [Making Pipelines Reusable](#making-pipelines-reusable)
  - [Introducing Stage Templates](#introducing-stage-templates)
  - [Referencing a Pipeline Repository From a Pipeline](#referencing-a-pipeline-repository-from-a-pipeline)
    - [Pipeline Templates in Azure Repos](#pipeline-templates-in-azure-repos)
    - [Pipeline Templates in GitHub](#pipeline-templates-in-github)
- [Include PowerApps Checker in a Pipeline](#include-powerapps-checker-in-a-pipeline)
  - [Create an Application Registration for PowerApps Checker](#create-an-application-registration-for-powerapps-checker)
  - [Create Additional Pipeline Variables Required to Call PowerApps Checker](#create-additional-pipeline-variables-required-to-call-powerapps-checker)
  - [Install Sarif Viewer Build Tab](#install-sarif-viewer-build-tab)
  - [Invoke PowerApps Checker From a Test Stage in a Pipeline](#invoke-powerapps-checker-from-a-test-stage-in-a-pipeline)

## Introduction

Often times in large development efforts, a codebase will rapidly approach a critical, messy mass where additional features become exponentially more difficult to implement. The developers' impulse here may be to stop all new feature development and redesign the entire system, but [this is never a good idea](http://www.luckymethod.com/2013/03/the-big-redesign-in-the-sky/). Instead, we need to start making iterative changes to our code to clean it as we add new features. In this article, we are going to be celebrating this philosophy.

As a new deliverable in our DevOps environment, we will be enforcing some code quality rules by including [PowerApps Checker](https://docs.microsoft.com/en-us/powerapps/developer/common-data-service/checker/webapi/overview) in the build stage of our pipeline. We can consume the results of the report generated by this module to prevent developers from introducing common D365 CE anti-patterns to our codebase.

## Making Pipelines Reusable

It is very likely your D365 CE deployment will consist of more than one solution. While the components that comprise your solution may be distinct, the pipelines you use to deploy these solutions will be quite similar, if not completely identical. That said, it would be an ironic shame if we were to start copying and pasting our code while incorporating *DevOps*.

There are many strategies for organizing your D365 CE solution architecture in source control. We will be exploring some of them in later blog posts, but for the purposes of this article, let's assume that we've landed on a strategy which includes storing our pipeline templates in a separate repository. You can import, fork, or directly reference [our pipeline repository](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-Pipelines), or create your own.

### Introducing Stage Templates

[Stage templates](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema#stage-templates) allow us to write the YAML for our stages in separate files, enabling us to gain the power of new multi-stage pipelines combined with the cleanliness of modularity. At the time of writing this article, there are templates for stages, jobs, steps, and variables. Eventually, we will be using each of them, but for now, we'll start with stage templates, leaving the world a little better than we found it.

```YAML
stages:
- stage: Build
  jobs:
  - job:
    displayName: "Pack Solution from repository"
```
*Excerpt from [stages/build.yml](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-Pipelines/blob/blog-part-2.0/stages/build.yml)*

For the full source code of the stage template, click the link above. Since we're planning on using other template types here, let's think ahead a little bit and place our stage templates in a folder. Of course, the eventual increasing complexity of this project may call for that organizational strategy to change.

```YAML
stages:
- stage: Release

  dependsOn: Build
  condition: succeeded('Build')

  jobs:
  - deployment: Deploy
    displayName: "Import solution artifact"
```
*Excerpt from [stages/release.yml](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-Pipelines/blob/blog-part-2.0/stages/release.yml)*

Migrating the Release stage to an external template should be a practice of repetition at this point. We will be improving these stage templates soon, and I encourage you to experiment with how you can find an organizational strategy that works for your team.

### Referencing a Pipeline Repository From a Pipeline

Since the stage templates we've created are tracked in an external repository, we will need to make them available by adding a [repository resource](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema#repository-resource) to our pipeline. The steps for this are going to vary slightly based on where your pipeline templates repository is stored:

#### Pipeline Templates in Azure Repos

If you chose to import our repository or create your own in Azure Repos, you can simply reference it by name in a `repository` entry, as explained in the [documentation for the `type` parameter](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema#type).

```YAML
name: $(BuildDefinitionName)-$(Date:yyyyMMdd).$(Rev:.r)

trigger:
- master

resources:
  repositories:
  - repository: templates
    type: git
    name: pipeline-templates

stages:
- template: stages/build.yml@templates
- template: stages/release.yml@templates
```
*[azure-repos-build-release.yml](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-DevOps-Tutorial/blob/master/Lesson-2/Part-1/azure-repos-build-release.yml)*

#### Pipeline Templates in GitHub

If you are using GitHub for your repository, you will need to create a [service connection](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints?view=azure-devops&tabs=yaml), if you don't have one already. Be sure to adhere to the principle of least privilege. That is, you only need to read from a public repository, make sure your service connection only has that privilege.

##### Steps to Create a GitHub Service Endpoint

1. Create a personal access token in GitHub
    1. From GitHub, click on your Profile icon.
    2. Click **Settings**.
    3. Click **Developer Settings**.
    4. Click **Personal access tokens**.
    5. Click **Generate new token**.
    6. Enter a note, such as *"Read Public Repositories"*, and check the box for **public_repo**.
    7. Click **Generate token**.
    8. Click the clipboard icon to copy the token.

![Create a personal acces token in GitHub](https://github.com/microsoft-d365-ce-pfe-devops/d365-ce-devops-blogs/raw/master/media/devops/pipeline-templates/github-pat.gif)

2.  Create a service connection in Azure DevOps.
    1. From Azure Devops, click **Project Settings**.
    2. Click **Service connections** (in the **Pipelines** category).
    3. Click **New service connection**.
    4. Click **GitHub**.
    5. For *Choose authorization*, select **Personal access token**.
    6. Enter a *Connection Name*, such as *"pipeline-templates"*.
    7. For *Token*, paste the token from your clipboard.
    8. Click **OK**.

![Create a service connection in Azure DevOps](https://github.com/microsoft-d365-ce-pfe-devops/d365-ce-devops-blogs/raw/master/media/devops/pipeline-templates/azdops-create-service-connection.gif)

Now that you have a service connection, following the [documentation for the `type` parameter](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema#type), you can reference your repository by name and set the `endpoint` parameter to the name of your service connection. Also, if you want to point to a specific version of the external repository, supply the tag in the `ref` parameter. For example, if you are using our public pipelines repository, for the purposes of this tutorial, enter a value of `refs/tags/blog-part-2.0` for a version consistent with what we've learned so far. We will be updating this in a moment.

```YAML
name: $(BuildDefinitionName)-$(Date:yyyyMMdd).$(Rev:.r)

trigger:
- master

resources:
  repositories:
  - repository: templates
    type: github
    name: microsoft-d365-ce-pfe-devops/D365-CE-Pipelines
    ref: refs/tags/blog-part-2.0
    endpoint: pipeline-templates

stages:
- template: stages/build.yml@templates
- template: stages/release.yml@templates
```
*[azure-repos-build-release.yml](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-DevOps-Tutorial/blob/master/Lesson-2/Part-1/azure-repos-build-release.yml)*

After the changes we've made, if you attempt to run your Build & Release pipeline, you shouldn't notice any change in behavior.

## Include PowerApps Checker in a Pipeline

At the time of writing, the D365 CE product group has just released the [PowerApps checker PowerShell Module](https://community.dynamics.com/365/b/365teamblog/archive/2019/06/26/automatically-validate-your-solutions-using-the-powerapps-checker-powershell-module). In conjunction with this module, they have also released a [collection of official DevOps tasks](https://docs.microsoft.com/en-us/powerapps/developer/common-data-service/build-tools-tasks#quality-check) for invoking the service, and we will cover them in another article in the near future. For now, we will be using the PowerShell module. Let's add it to our environment and provide a report on our built solution.

For the purposes of this stage, we will be using the  [Invoke-PowerAppsChecker](https://docs.microsoft.com/en-us/powershell/module/microsoft.powerapps.checker.powershell/invoke-powerappschecker?view=pa-ps-latest) cmdlet. In order to call this, we're going to need a few new variables in our pipeline. At a minimum, we will need the following:
- Geography (or ApiUrl)
- Azure Tenant Id
- Client Application Id
- Client Application Secret
- Ruleset Id

### Create an Application Registration for PowerApps Checker

In order to add the Client Application Id / Secret, we will need to create an App Registration in Azure Active Directory. The [documentation on PowerApps Checker](https://docs.microsoft.com/en-us/powershell/powerapps/overview?view=pa-ps-latest#powerapps-checker-authentication-and-authorization) includes a [script to do this for you](https://docs.microsoft.com/en-us/powershell/powerapps/overview?view=pa-ps-latest#sample-script-to-create-an-aad-application). If you'd rather do this manually from the portal, you can follow [the instructions in the "How to"](https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-create-service-principal-portal), using the configurations provided below. If you choose to use the script, you can skip to [generating a client secret](#generate-a-secret-for-an-app-registration).

Per the documentation on PowerApps Checker, provide the following options when creating your App Registration:
- Redirect URI
  - Type: *Public client (mobile & desktop)*
  - Redirect URI: *urn:ietf:wg:oauth:2.0:oob*

<img alt="Create a Client Application in Azure Active Directory" src="https://github.com/microsoft-d365-ce-pfe-devops/d365-ce-devops-blogs/raw/master/media/devops/pipeline-templates/powerapps-checker-client.png" width="700"/>

Then, in *API permissions*, grant access to the *PowerApps-Advisor* API, giving Application permissions to Analysis.All.

![Grant application permissions of Analysis.All for the PowerApps-Advisor API](https://github.com/microsoft-d365-ce-pfe-devops/d365-ce-devops-blogs/raw/master/media/devops/pipeline-templates/powerapps-checker-api-permissions.gif)

Finally, <span id="generate-a-secret-for-an-app-registration">generate a secret for the registration.</span>

![Generate a client secret](https://github.com/microsoft-d365-ce-pfe-devops/d365-ce-devops-blogs/raw/master/media/devops/pipeline-templates/powerapps-checker-secret.gif)

### Create Additional Pipeline Variables Required to Call PowerApps Checker

Now that we have a client application that we can use to authenticate with the PowerApps Checker service, we can create the additional pipeline variables. Open up the pipeline we currently use for Build / Release and add the following variables:
- **azure.geography** - Region of data center to temporarily store reports generated by the PowerApps Checker service. [Read more](https://docs.microsoft.com/en-us/powershell/module/microsoft.powerapps.checker.powershell/get-powerappscheckerrulesets?view=pa-ps-latest#parameters).

  ***Note:** Based on your implementation, you may need to use ApiUrl instead. If so, be sure to modify the YAML file accordingly.*

- **azure.tenantId** - Example: *ab2cea59-d1df-4950-ad30-3d7f43d1a8d8*
- **powerAppsChecker.clientId** - Example: *24076c4b-1a57-4ca1-9da5-42f367cf57d8*
- **powerAppsChecker.clientSecret** - Generated in the steps shown above. Be sure to change this variable type to *secret*.

You can get **azure.tenantId** and **powerAppsChecker.clientId** from the *Overview* tab for the App registration you created.

<img alt="PowerApps Checker Client Application Registration Overview" src="https://github.com/microsoft-d365-ce-pfe-devops/d365-ce-devops-blogs/raw/master/media/devops/pipeline-templates/app-registration-overview.png" width="675" />

#### Retrieve the Ruleset Id

The final variable we will need in order to invoke PowerApps Checker is **powerAppsChecker.rulesetId**. You can use the [Get-PowerAppsCheckerRulesets](https://docs.microsoft.com/en-us/powershell/module/microsoft.powerapps.checker.powershell/get-powerappscheckerrulesets?view=pa-ps-latest) cmdlet to retrieve the available guids. At the time of writing, there are [two rulesets available](https://docs.microsoft.com/en-us/powerapps/developer/common-data-service/checker/webapi/overview#rulesets-and-rules). The guids will never change, so you are free to store these as a variable to re-use them for your pipelines.

- **powerAppsChecker.rulesetId**
  - *083a2ef5-7e0e-4754-9d88-9455142dc08b* for AppSource Certification
  - *0ad12346-e108-40b8-a956-9a8f95ea18c9* for Solution Checker

### Install Sarif Viewer Build Tab

The PowerApps Checker service will generate a JSON file following the [SARIF](http://docs.oasis-open.org/sarif/sarif/v2.0/sarif-v2.0.html) schema. Once we invoke the service from our pipeline, we will want a convenient way to view the results. The Microsoft DevLabs team has released an experimental, [open-source](https://github.com/microsoft/sarif-azuredevops-extension) Azure DevOps extension for this called [Sarif Viewer Build Tab](https://marketplace.visualstudio.com/items?itemName=sariftools.sarif-viewer-build-tab). Open that link and install it into your Azure DevOps organization in order to view the results of PowerApps Checker within your Pipeline summary.

### Invoke PowerApps Checker From a Test Stage in a Pipeline

We now have all of the pieces in place to add an additional stage to our Pipeline and start invoking PowerApps Checker. Add the following YAML file to your pipelines repository, or if you're referencing ours, update your reference to use the [blog-part-2.1 tag](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-Pipelines/tree/blog-part-2.1), which contains the newest *test.yml* file.

```YAML
stages:
- stage: Test

  dependsOn: Build
  condition: succeeded('Build')

  jobs:
  - job:
    displayName: 'Run PowerApps Checker'

    pool:
      vmImage: 'vs2017-win2016'

    steps:
    - task: DownloadBuildArtifacts@0
      inputs:
        buildType: 'current'
        downloadType: 'single'
        artifactName: 'drop'
        downloadPath: '$(System.ArtifactsDirectory)'

    - powershell: Install-Module -Name Microsoft.PowerApps.Checker.PowerShell -Scope CurrentUser -Force
      displayName: 'Install Microsoft.PowerApps.Checker.PowerShell'

    - powershell: |
        md '$(Common.TestResultsDirectory)\powerapps-checker'

        Import-Module Microsoft.PowerApps.Checker.PowerShell
        $ruleset = New-Object Microsoft.PowerApps.Checker.Client.Models.Ruleset
        $ruleset.Id = [Guid]::Parse('$(powerAppsChecker.rulesetId)')

        Invoke-PowerAppsChecker `
          -Geography $(azure.geography) `
          -ClientApplicationId $(powerAppsChecker.clientId) `
          -TenantId $(azure.tenantId) `
          -Ruleset $ruleset `
          -FileUnderAnalysis '$(System.ArtifactsDirectory)\drop\packedSolution\$(solution.name)_managed.zip' `
          -OutputDirectory '$(Common.TestResultsDirectory)\powerapps-checker' `
          -ClientApplicationSecret (ConvertTo-SecureString -AsPlainText -Force -String '$(powerAppsChecker.clientSecret)')
      displayName: 'Invoke PowerApps Checker'

    - powershell: md '$(Common.TestResultsDirectory)\powerapps-checker\unzipped'
      displayName: 'Create folder for unzipped results'

    - task: ExtractFiles@1
      inputs:
        archiveFilePatterns: '$(Common.TestResultsDirectory)\powerapps-checker\*.zip'
        destinationFolder: '$(Common.TestResultsDirectory)\powerapps-checker\unzipped'
      displayName: 'Extract results to folder'

    - task: PublishBuildArtifacts@1
      inputs:
        pathtoPublish: '$(Common.TestResultsDirectory)\powerapps-checker\unzipped'
        artifactName: CodeAnalysisLogs
      displayName: 'Publish PowerApps Checker report artifacts'
```
*[stages/test.yml](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-Pipelines/blob/blog-part-2.1/stages/test.yml)*

Note that at the time of writing, it is important that your artifact be called "CodeAnalysisLogs". The current version of the Sarif Viewer Build Tab extension is hard-coded to only read from that folder. Also, the tab extension will not read from zip files, so you need to extract the SARIF files into that folder.

You will also need to update your main YAML file to include a reference to the newly created stage:

```YAML
name: $(BuildDefinitionName)-$(Date:yyyyMMdd).$(Rev:.r)

trigger:
- master

resources:
  repositories:
  - repository: templates
    type: github
    name: microsoft-d365-ce-pfe-devops/D365-CE-Pipelines
    ref: refs/tags/blog-part-2.1
    endpoint: pipeline-templates

stages:
- template: stages/build.yml@templates
- template: stages/test.yml@templates
- template: stages/release.yml@templates
```
*[github-build-test-release.yml](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-DevOps-Tutorial/blob/master/Lesson-2/Part-2/github-build-test-release.yml)*
<br/>(Azure Repos version: *[azure-repos-build-test-release.yml](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-DevOps-Tutorial/blob/master/Lesson-2/Part-2/azure-repos-build-test-release.yml)*)

Once you've committed that, you should be able to run your pipeline and watch as the Test stage completes prior to beginning the Release stage. Once the Test stage completes, from the Pipeline review, you should see a "Scans" tab, which will show the results of the PowerApps Checker.

<img alt="PowerApps Checker Scans Tab (No Results)" src="https://github.com/microsoft-d365-ce-pfe-devops/d365-ce-devops-blogs/raw/master/media/devops/pipeline-templates/powerapps-checker-no-results.png" width="800" />

However, right now, if you are using the sample solution from our tutorial repository, this view is pretty unexciting. Feel free to verify it by adding a solution component that violates a PowerApps Checker rule. Alternatively, you can download and check in the newest [ExtractedSolution](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-DevOps-Tutorial/tree/master/Lesson-2/ExtractedSolution) folder from our [tutorial repository](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-DevOps-Tutorial/) for a version of the solution containing a JavaScript file that should throw off some red flags:

![PowerApps Checker Scans Tab (No Results)](https://github.com/microsoft-d365-ce-pfe-devops/d365-ce-devops-blogs/raw/master/media/devops/pipeline-templates/powerapps-checker-bad-javascript.png)

That's it for this article! There's still plenty of room to add value here. As a fun challenge for yourself, see if you can parse the results of the PowerApps Checker programmatically and actually cause the Test stage to fail if any results are found. We will be providing a solution to this in our next entry. (**Hint:** The PowerApps Checker result includes a property called *IssueSummary*.)

Thanks for reading, feel free to ask any questions in the comments section below, and happy DevOps-ing!
# Introduction to DevOps for Dynamics 365 Customer Engagement using YAML Based Azure Pipelines - Part 1.5

In our [last blog](https://community.dynamics.com/crm/b/crminthefield/archive/2019/02/27/introduction-to-devops-for-dynamics-365-customer-engagement-using-yaml-based-azure-pipelines) we learned why it is important to version control our solutions and explored how to pack a solution from a repository for deployment to downstream environments. Now it's time to update our script a bit to take advantage of some cool new features and get ready for our next blog. During the [Microsoft Build 2019](https://mybuild.techcommunity.microsoft.com/home#top-anchor) developer conference, multi-stage pipelines were announced enabling us to create a full CI/CD pipeline in YAML, which will allow us to properly perform continuous deployment on our solutions.

For a deeper look into changes announced during the Build conference check out the [What's new with Azure Pipelines](https://devblogs.microsoft.com/devops/whats-new-with-azure-pipelines/) blog and the [announcement for YAML Release in Azure Pipelines]( https://mybuild.techcommunity.microsoft.com/sessions/77791?source=sessions#top-anchor) session at Build.

Rather than re-hash the basics and everything else we've done to this point I will urge you to check out the [first blog]((https://community.dynamics.com/crm/b/crminthefield/archive/2019/02/27/introduction-to-devops-for-dynamics-365-customer-engagement-using-yaml-based-azure-pipelines)) in the series. In this blog, we will look at the new pipeline features, add stages and complete a solution deployment using multi-stage YAML pipelines. The goal, for now, being to automate solution deployment from our source control management (SCM) system as highlighted in the flow diagram below. In the future, we will look at adding more automation and explore different concepts.

<p align="center">
  <img src="https://github.com/microsoft-d365-ce-pfe-devops/d365-ce-devops-blogs/blob/a652a56baaf70807179f1c201b59fdb78526d00e/media/devops/multi-stage-pipelines/blog-pipeline-graphic.png">
</p>


  - [Getting started](#getting-started)
    - [Updating our build script for a multi-stage setup](#updating-our-build-script-for-a-multi-stage-setup)
      - [Steps to create pipeline variables](#steps-to-create-pipeline-variables)
    - [Adding the release stage](#adding-the-release-stage)
      - [Download artifacts](#download-artifacts)
      - [Import solution into target environment](#import-solution-into-target-environment)
        - [Add deployment variables](#add-deployment-variables)
  - [Additional Resources](#additional-resources)

## Getting started

If multi-stage pipelines are not enabled by default when you read this you will first need to enable the preview feature. This can be accomplished using the following steps. 

1. Navigate to your Azure DevOps instance (e.g. https://dev.azure.com/example/project)
2. Click your profile icon in the top right of the page.
3. In the drop-down click *Preview features*
4. In the Preview feature pane toggle *Multi-stage pipelines*
5. Close the pane and you are all set to go.

![enable preview feature](https://github.com/microsoft-d365-ce-pfe-devops/d365-ce-devops-blogs/blob/f0916cb1c6187d503882b43e2381820d5bc0b421/media/devops/multi-stage-pipelines/enable-preview.gif?raw=true)

### Updating our build script for a multi-stage setup

Below you will find the complete script from the first blog that enables us to deploy any unpacked solution stored in version control. The difference is that this time the script has some new syntax to enable the code to be used in multiple stages. The notable changes in the section are the addition of the `stages` and `job` schema. Stages are collections of jobs that will allow us to logically divide our pipeline between various continuous integration and continuous deployment processes. Jobs are collections of steps that will help us logically divide work within stages. In both cases, we can set dependencies and conditions on other processes or run in parallel.

If you are following along from the first blog I have called out the changes that have been made. Otherwise, follow the steps below to implement the updated solution deployment script using a multi-stage pipeline. **If you haven't unpacked your solution and checked it into version control go back to the [first blog](https://community.dynamics.com/crm/b/crminthefield/archive/2019/02/27/introduction-to-devops-for-dynamics-365-customer-engagement-using-yaml-based-azure-pipelines) for more information.** **Alternately, you can [fork the tutorial repository on GitHub](https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-DevOps-Tutorial) and use the Lesson-1.5 folder for setup.** 

If you are starting from scratch or have forked the tutorial repo follow the steps below to create a new pipeline.

1. Navigate to your Azure DevOps project repository. For example, *https://dev.azure.com/{username}/D365-CE-DevOps-Tutorial*
2. Hover over *Pipelines*, then click *Pipelines* in the fly-out menu.
3. Click *New*, then click *New Pipeline*
5. On the next screen, we will select the location of our unpacked solution: Azure Repos, GitHub, or another service. Note that choosing GitHub or other services requires that you authorize Azure DevOps to access the repository, the behavior otherwise is the same in our build pipelines.
6. Select the repository containing the unpacked solution files.
7. Configure pipeline using the Starter pipeline option and copy/paste the script below replacing the starter script. If you have forked the repo on GitHub choose the existing YAML script in the Lesson-1.5 directory.
7. Click *Save and run*
8. Enter a commit message and click *Save and run* again
9. Click *Cancel* to stop the build
10. Click the ellipsis (…) in the top right 
11. In the drop-down, click edit pipeline. We will need to add some variables to make things function correctly. follow the [steps to create pipeline variables](#steps-to-create-pipeline-variables) below to continue.

```yaml
name: $(BuildDefinitionName)-$(Date:yyyyMMdd).$(Rev:.r)

trigger:
- master

stages:

 - stage: Build

   jobs:

    - job:
      displayName: "Pack Solution from repository"

      pool:
        vmImage: 'vs2017-win2016'

      steps:
      - script: md tools
        displayName: 'Create tools directory'

      - powershell: |
          Invoke-WebRequest `
            -Uri https://dist.nuget.org/win-x86-commandline/latest/nuget.exe `
            -OutFile tools\\nuget.exe
        displayName: 'Download nuget.exe'

      - powershell: |
          tools\\nuget.exe install Microsoft.CrmSdk.CoreTools -O tools
          md "tools\\CoreTools"
          $coreToolsFolder = Get-ChildItem tools | Where-Object {$_.Name -match 'Microsoft.CrmSdk.CoreTools.'}
          move "tools\\$coreToolsFolder\\content\\bin\\coretools\\*.*" "tools\\CoreTools"
          Remove-Item "tools\\$coreToolsFolder" -Force -Recurse
        displayName: 'Install CoreTools'

      # Don't forget to add the env variables to your pipeline settings
      - powershell: |
          Start-Process tools/CoreTools/SolutionPackager.exe `
          -ArgumentList `
            "/action: Pack", `
            "/zipfile: $(Build.ArtifactStagingDirectory)\packedSolution\$env:SolutionName.zip", `
            "/folder: $env:SolutionPath", `
            "/packagetype: Both" `
          -Wait `
          -NoNewWindow
        env:
          SolutionPath: $(solution.path)
          SolutionName: $(solution.name)
        displayName: 'Solution Packager: pack solution'          

      - task: PublishBuildArtifacts@1
        inputs:
          pathtoPublish: $(Build.ArtifactStagingDirectory)
          artifactName: drop
        displayName: 'Publish build artifacts'
```

If you do not want the build to automatically run on commits to master set `trigger` to `none`.

**Schema changes**

Note that the only change above to the original script is the following 5 lines and an adjustment to the indentation level of code following our additions.

```yaml
stages:
 - stage: Build
   jobs:
    - job:
      displayName: "Pack Solution from repository"
```

Review the Microsoft Docs page for [Jobs](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/phases?tabs=yaml&view=azure-devops) for examples of how to setup jobs with varying degrees of complexity and the [Stages](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/stages?view=azure-devops&tabs=yaml) page for similar examples.

#### Steps to create pipeline variables

For our pipeline to be able to access the variables defined in code, we will need to manually create the variables in our pipeline settings using the following steps:

1. Click the ellipsis (…) on the top right of the page and in the drop-down click *Variables*
2. Click *+ Add* in the pipeline variables view to add a new variable.
3. Perform step 3 two times to add the following variables
   - name: `solution.name`
     - **value**: <desired zip file name. In this example, *contosoUniversity*>
   - name: `solution.path`
     - **value**: <path to repository location of extracted solution. in this example, *Lesson-1.5/ExtractedSolution/*>
4. Checkmark both as *Settable at queue time*
5. Click the *Save & queue* drop down and click Save
6. Enter a comment and click *Save*

You may now run the script setting the variables for solution name and solution path if you have not defined them in your variable settings. The result should be a new build artifact named drop that contains you packed solution as both managed and unmanaged. 

![setup-pipeline-variables](https://github.com/microsoft-d365-ce-pfe-devops/d365-ce-devops-blogs/blob/ef1878fdb12e11b75c4ee5e99ae8cd26434cb022/media/devops/multi-stage-pipelines/setup-pipeline-variables.gif?raw=true)

### Adding the release stage

Now that we have completed our build stage we can create a new stage to consume and deploy the solution artifact we published earlier. For added utility, we will use a [deployment job](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/deployment-jobs?view=azure-devops) to track deployments to our downstream environments. For this example, our release stage will be dependent on the success of the build stage using [dependencies](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/stages?view=azure-devops&tabs=yaml#dependencies) and [conditions](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/stages?view=azure-devops&tabs=yaml#conditions). Note that by default stages are sequential so this change is more for demonstration than necessity in this example. 

```yaml
 - stage: Release
   dependsOn: Build
   condition: succeeded('Build') 

   jobs:

    - deployment: Deploy
      displayName: "Import solution artifact"

      pool:
        vmImage: 'vs2017-win2016'

      environment: test
      
      strategy:
        runOnce:
          deploy:
      
            steps:
```

**Schema explanation**

- [**deployment**](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/deployment-jobs?view=azure-devops) - a deployment is a special type of job focused on deploying apps to your environments allowing you to track deployments more granularly.
- [**environment**](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/environments?view=azure-devops) - the name of the environment we wish to deploy to. <u>Note that if you provide an environment name for an environment that you have not explicitly created yet one will be automatically created without associated resources</u>, which is what we want in this case.
- **strategy** - at the time of writing only the runOnce strategy is available, this step will run the deployment exactly one time.
- **deploy** - the entry point to our deployment steps.

#### Download artifacts

Continuing on with our script we will need to download the solution artifact we publisher earlier. The reason we need to download the artifact is because we have logical separation using jobs in which artifacts are not shared across boundaries.

```yaml
            - task: DownloadBuildArtifacts@0
              inputs:
                buildType: 'current'
                downloadType: 'single'
                artifactName: 'drop'
                downloadPath: '$(System.ArtifactsDirectory)'
```

*Note that indentation has been left for copy/paste purposes. If you have issues with the script check your indentation.

While this snippet of code is very simple I will demonstrate adding it via task assistant in the YAML editor as it can be very handy for adding pre-made tasks in a quick and efficient manner.

1. Open your pipeline editor
2. On the right, you should see a task pane. If not, click *Show assistant* in the top right of the editor window.
3. In the search box type *download build artifacts*
4. Click the *Download Build Artifacts* task
5. Enter your artifact name (e.g. drop)
6. Ensure that you have clicked the line in your editor where you would like to have the task added.
7. Click Add
8. Update indentation as needed.
9. Save your pipeline and run to test your changes.

![Add task using task assistant](https://github.com/microsoft-d365-ce-pfe-devops/d365-ce-devops-blogs/blob/f0916cb1c6187d503882b43e2381820d5bc0b421/media/devops/multi-stage-pipelines/task-assistant-usage.gif?raw=true)

#### Import solution into target environment

The only change to our actual deployment code from the [first blog](https://community.dynamics.com/crm/b/crminthefield/archive/2019/02/27/introduction-to-devops-for-dynamics-365-customer-engagement-using-yaml-based-azure-pipelines#import-solution-into-target-environment) other than moving to a release stage and using deployment jobs is that we are now importing asynchronously. Importing asynchronously will help us avoid import timeout issues as noted by readers of the first blog. 

```yaml
            - powershell: Install-Module Microsoft.Xrm.Data.Powershell -Scope CurrentUser -Force
              displayName: 'Install Microsoft.Xrm.Data.PowerShell'

            # Don't forget to add the env variables to your pipeline settings
            - powershell: |
                $connection = Get-CrmConnection `
                  -ConnectionString `
                    ("AuthType = Office365;" + `
                    "Username = $env:ServiceAccountUpn;" + `
                    "Password = $env:ServiceAccountPassword;" + `
                    "Url = https://$env:EnvironmentName.crm.dynamics.com")

                Import-CrmSolutionAsync -BlockUntilImportComplete `
                  -conn $connection `
                  -SolutionFilePath $(System.ArtifactsDirectory)\drop\packedSolution\$($env:SolutionName)_managed.zip
              env:
                EnvironmentName: $(environment.name)
                SolutionName: $(solution.name)
                ServiceAccountUpn: $(serviceAccount.upn)
                ServiceAccountPassword: $(serviceAccount.password)
              displayName: 'Import solution'
```

*Note that indentation has been left for copy/paste purposes. If you have issues with the script check your indentation.

##### Add deployment variables

**Important** - We have added some environment variables. We will need to edit our pipeline settings once more following the [steps to create pipeline variables](#steps-to-create-pipeline-variables) section to add the three new variables below.

- **name**: `environment.name` 
  - **value**: <Dynamics 365 CE org name e.g. **contoso**.crm.dynamics.com, name only>. If your org is in another geo update the YAML script accordingly.
- name: `serviceAccount.upn`
  - **value**: [example@contoso.onmicrosoft.com](mailto:example@contoso.onmicrosoft.com)
- name: `serviceAccount.password`
  - **value**: hopefully not [hunter2](http://bash.org/?244321=)
  - For the password variable be sure to select the lock symbol to change the type of the field to secret.

That's it, now click Save to commit your changes, then click Run to start the pipeline. Once started you will be redirected to the pipeline summary page to see the action in real-time. Click on the various stage cards to view details. Once the build is completed you can click *Environments* on the left navigation pane to view past deployments to the environment we created earlier. 

If you would like to use some pre-made tasks and leverage the task assistant we discussed in the [download artifacts](#download-artifacts) section check out [Dynamics 365 Build Tools](https://marketplace.visualstudio.com/items?itemName=WaelHamze.xrm-ci-framework-build-tasks).  

In our upcoming blog(s) we will explore templates to make our pipeline code reusable and look at some new tooling to improve our continuous integration process.

## Additional Resources

- [aka.ms/YAML](https://aka.ms/YAML)
- [Announcement for YAML Release in Azure Pipelines]( https://mybuild.techcommunity.microsoft.com/sessions/77791?source=sessions#top-anchor)

- [What's new with Azure Pipelines](https://devblogs.microsoft.com/devops/whats-new-with-azure-pipelines/)
- Example code - https://github.com/microsoft-d365-ce-pfe-devops/D365-CE-DevOps-Tutorial
- [Dynamics 365 Build Tools](https://marketplace.visualstudio.com/items?itemName=WaelHamze.xrm-ci-framework-build-tasks) - Azure Pipeline tasks for automating build & deployment

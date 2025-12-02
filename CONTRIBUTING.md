# Contributing to Advanced HTTP Plugin

We'd love for you to contribute to our source code and to make Advanced HTTP even better than it is
today! Here are the guidelines we'd like you to follow:

 - [Issues and Bugs](#issue)
 - [Feature Requests](#feature)
 - [Submission Guidelines](#submit)

## <a name="issue"></a> Found an Issue?

If you find a bug in the source code or a mistake in the documentation, you can help us by
submitting an issue to our [GitHub Repository](https://github.com/silkimen/cordova-plugin-advanced-http/issues).
Even better you can submit a Pull Request with a fix.

## <a name="feature"></a> Want a Feature?

You can request a new feature by submitting an issue to our
[GitHub Repository](https://github.com/silkimen/cordova-plugin-advanced-http/issues).
If you would like to implement a new feature then consider what kind of change it is:

* **Major Changes** that you wish to contribute to the project should be discussed first so that we
  can better coordinate our efforts, prevent duplication of work, and help you to craft the change
  so that it is successfully accepted into the project. Please submit an issue to our GitHub Repository
  for discussion.
* **Small Changes** can be crafted and submitted to the GitHub Repository as a Pull Request.

## <a name="submit"></a> Submission Guidelines

### Submitting an Issue
Before you submit your issue search the archive, maybe your question was already answered.

If your issue appears to be a bug, and hasn't been reported, open a new issue. Help us to maximize
the effort we can spend fixing issues and adding new features, by not reporting duplicate issues.
Providing the following information will increase the chances of your issue being dealt with
quickly:

* **Overview of the Issue** - if an error is being thrown a non-minified stack trace helps
* **Motivation for or Use Case** - explain why this is a bug for you
* **Advanced HTTP Version(s)** - is it a regression?
* **Operating System** - is this a problem with all supported OS or only specific ones?
* **Related Issues** - has a similar issue been reported before?
* **Suggest a Fix** - if you can't fix the bug yourself, perhaps you can point to what might be
  causing the problem (line of code or commit)

**If you get help, help others. Good karma rulez!**

### Submitting a Pull Request
Before you submit your pull request consider the following guidelines:

* Search [GitHub](https://github.com/silkimen/cordova-plugin-advanced-http/pulls) for an open or
  closed Pull Request that relates to your submission. You don't want to duplicate effort.
* Make your changes in a new git branch:

    ```shell
    git checkout -b my-fix-branch master
    ```
* Create your patch
* Commit your changes using a descriptive commit message
* Push your branch to GitHub:

    ```shell
    git push origin my-fix-branch
    ```

In GitHub, send a pull request to `cordova-plugin-advanced-http:master`.
If we suggest changes or the [CI build fails](#cibuild), then:

* Make the required updates.
* Commit your changes to your branch (e.g. `my-fix-branch`).
* Push the changes to your GitHub repository (this will update your Pull Request).

That's it! Thank you for your contribution!

### <a name="cibuild"></a> Pull Request Feedback
You can always check the results of the latest CI builds on [Github Actions](https://github.com/silkimen/cordova-plugin-advanced-http/actions).
You can use this information to inspect failing tests in your PR.

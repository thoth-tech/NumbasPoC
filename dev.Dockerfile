FROM mcr.microsoft.com/devcontainers/ruby:3.1-bullseye

# DEBIAN_FRONTEND=noninteractive is required to install tzdata in non interactive way
ENV DEBIAN_FRONTEND noninteractive
ENV USER='vscode'
ENV NODE_VERSION 16.20.0
ENV NODE_ENV docker
ENV NPM_CONFIG_PREFIX="/home/${USER}/.npm-global"
ENV BUNDLE_PATH=/home/${USER}/.gems

RUN apt-get update \
  && apt-get clean \
  && ARCH= && dpkgArch="$(dpkg --print-architecture)" \
  && case "${dpkgArch##*-}" in \
    amd64) ARCH='x64';; \
    ppc64el) ARCH='ppc64le';; \
    s390x) ARCH='s390x';; \
    arm64) ARCH='arm64';; \
    armhf) ARCH='armv7l';; \
    i386) ARCH='x86';; \
    *) echo "unsupported architecture"; exit 1 ;; \
  esac \
  && set -ex \
  && for key in \
    4ED778F539E3634C779C87C6D7062848A1AB005C \
    141F07595B7B3FFE74309A937405533BE57C7D57 \
    74F12602B6F1C4E913FAA37AD3A89613643B6201 \
    61FC681DFB92A079F1685E77973F295594EC4689 \
    8FCCA13FEF1D0C2E91008E09770F7A9A5AE15600 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
    890C08DB8579162FEE0DF9DB8BEAB4DFCF555EF4 \
    C82FA3AE1CBEDC6BE46B9360C43CEC45C17AB93C \
    108F52B48DB57BB0CC439B2997B01419BD92F80A \
  ; do \
      gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys "$key" || \
      gpg --batch --keyserver keyserver.ubuntu.com --recv-keys "$key" ; \
  done \
  && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$ARCH.tar.xz" \
  && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
  && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
  && grep " node-v$NODE_VERSION-linux-$ARCH.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
  && tar -xJf "node-v$NODE_VERSION-linux-$ARCH.tar.xz" -C /usr/local --strip-components=1 --no-same-owner \
  && rm "node-v$NODE_VERSION-linux-$ARCH.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt \
  && ln -s /usr/local/bin/node /usr/local/bin/nodejs \
  # smoke tests
  && node --version \
  && npm --version \
  && gem install bundler
# Install MariaDB server
RUN apt-get update && apt-get install -y mariadb-server && apt-get clean

# Copy the initialization script
COPY .devcontainer/init-mariadb.sh /tmp/init-mariadb.sh

RUN chmod +x /tmp/init-mariadb.sh
# Expose the MariaDB port
EXPOSE 3306

USER "${USER}"

WORKDIR /workspace

RUN mkdir -p "${NPM_CONFIG_PREFIX}/lib" \
  && npm install -g npm@9.2.0 \
  && npm --global config set user "${USER}" \
  && npm install -g husky standard-version @angular/cli

# Install oh-my-zsh, powerlevel10k theme, and plugins
RUN git clone https://github.com/romkatv/powerlevel10k.git ~/.oh-my-zsh/custom/themes/powerlevel10k \
  && git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting \
  && git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

ENV RAILS_ENV development
ENV PATH /home/$USER/.gems/ruby/3.1.0/bin:$PATH:/tmp/texlive/bin/x86_64-linux:/tmp/texlive/bin/aarch64-linux:$PATH:/home/${USER}/.npm-global/bin
ENV GEM_PATH /home/$USER/.gems/ruby/3.1.0:$GEM_PATH

# Install the web ui
WORKDIR /workspace/frontend/numbas-test-fe
COPY --chown="${USER}":"${USER}" frontend/numbas-test-fe/package.json /workspace/frontend/numbas-test-fe

# Install web ui packages
RUN npm install

# Setup the folder where we will deploy the code
WORKDIR /workspace/backend/my-grape-app

COPY --chown="${USER}":"${USER}" backend/my-grape-app/Gemfile /workspace/backend/my-grape-app/Gemfile
COPY --chown="${USER}":"${USER}" backend/my-grape-app/Gemfile.lock /workspace/backend/my-grape-app/Gemfile.lock

RUN bundle install

WORKDIR /workspace

COPY --chown="${USER}":"${USER}" .devcontainer /workspace/.devcontainer

ENV HISTFILE /workspace/tmp/.zsh_history


RUN sudo chmod +x /workspace/.devcontainer/*.sh
ENTRYPOINT [ "/workspace/.devcontainer/docker-entrypoint.sh" ]
CMD [ "sleep", "infinity" ]
